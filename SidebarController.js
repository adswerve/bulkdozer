/*
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */

/**
 * This module contains functions that are called by the sidebar to interact
 * with server side functionality
 */

/**
 * Returns the content of an html file so it can be included in the sidebar
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Clears a given range in the sheet
 *
 * params:
 *  job: job passed by the sidebar
 *  job.a1Notation: required parameter identifying the range to clear
 *
 * returns: The job object
 */
function _clear(job) {
  var sheetDAO = new SheetDAO();

  sheetDAO.clear(job.sheetName, job.range);

  return job;
}
function clear(job) {
  return _invoke('_clear', job);
}

/**
 * Navigates sheets to a specific tab
 */
function _goToTab(tabName) {
  var sheetDAO = new SheetDAO();

  sheetDAO.goToTab(tabName);
}
function goToTab(tabName) {
  return _invoke('_goToTab', tabName);
}

/**
 * Loads data from CM
 *
 * params:
 *  job.entity defines which entity to load
 */
function _identifySpecifiedItemsToLoad(job) {
  var loader = getLoader(job.entity);

  loader.identifyItemsToLoad(job);

  return job;
}
function identifySpecifiedItemsToLoad(job) {
  return _invoke('_identifySpecifiedItemsToLoad', job);
}

/**
 * Fetches items to load from CM, maps to feed and writes to the sheet
 * params:
 *  job.entity defines which entity to load
 *  job.idsToLoad defines specific item ids to load
 *  job.parentItemIds ids of parent items to load child items for
 */
function _cmLoad(job) {
  var loader = getLoader(job.entity);

  loader.load(job);

  return job;
}
function cmLoad(job) {
  return _invoke('_cmLoad', job);
}

/**
 * Pushes data to CM
 *
 * params:
 *  job: the job object
 *  job.entity: name of the entity to use to find the correct loader
 *  job.feedItem: the dictionary representing an item in the feed
 */
function _cmPush(job) {
  var loader = getLoader(job.entity);

  loader.push(job);

  return job;
}
function cmPush(job) {
  return _invoke('_cmPush', job);
}

/**
 * Updates the feed after the push
 *
 * params:
 *  job: the job object
 *  job.entity: name of the entity to use to find the correct loader
 *  job.feed: list of dictionaries with items to update
 */
function _updateFeed(job) {
  var loader = getLoader(job.entity);

  loader.updateFeed(job);

  return job;
}
function updateFeed(job) {
  return _invoke('_updateFeed', job);
}

/**
 * Saves the ID map to the Store tab
 *
 * params:
 *  job: the job object
 *
 * returns: job.idMap with the current id map in the sheet
 */
function _saveIdMap(job) {
  getIdStore().initialize(job.idMap);

  getIdStore().store();

  return job;
}
function saveIdMap(job) {
  return _invoke('_saveIdMap', job);
}

/**
 * Loads the ID map from the Store tab
 *
 * params:
 *  job: the job object
 *
 * returns: job.idMap with the current id map in the sheet
 */
function _loadIdMap(job) {
  getIdStore().load();

  job.idMap = getIdStore().getData();

  return job;
}
function loadIdMap(job) {
  return _invoke('_loadIdMap', job);
}

/**
 * Write logs to the Log tab
 *
 * params:
 *  job.jobs: List of jobs to process
 *  job.jobs[1..N].logs: logs to output
 *  job.offset: offset to write in case existing logs already exist. If offset
 *  is 0 this also clears the log tab
 */
function _writeLogs(job) {
  var sheetDAO = new SheetDAO();
  var output = [];

  job.offset = job.offset || 0;
  var range = 'A' + (job.offset + 1) + ':B';

  for(var i = 0; i < job.jobs.length && job.jobs[i].logs; i++) {
    var logs = job.jobs[i].logs;

    for(var j = 0; j < logs.length; j++) {
      output.push(logs[j]);
    }

    job.jobs[i].logs = [];
  }

  if(output.length > 0) {
    job.offset += output.length;

    sheetDAO.setValues('Log', range + (job.offset), output);
  }

  return job;
}
function writeLogs(job) {
  return _invoke('_writeLogs', job);
}

/**
 * Initializes a push job. Primarily focused on incrementing the job id which
 * is part of cache keys, this prevents from stale objects in the cache to be
 * reused by a new job execution.
 *
 * params:
 *  job: Empty object
 */
function _initializeJob(job) {
  var userProperties = PropertiesService.getUserProperties();

  var jobId = userProperties.getProperty('jobId');

  if(!jobId) {
    userProperties.setProperty('jobId', 0);
  } else {
    userProperties.setProperty('jobId', Number(jobId) + 1);
  }

  job.jobId = userProperties.getProperty('jobId');

  return job;
}
function initializeJob(job) {
  return _invoke('_initializeJob', job);
}

/**
 * Write logs to the Log tab
 *
 * params:
 *  job.jobs: List of jobs to process
 *  job.jobs[1..N].logs: logs to output
 *  job.offset: offset to write in case existing logs already exist. If offset
 *  is 0 this also clears the log tab
 */
function _writeLogs(job) {
  var sheetDAO = new SheetDAO();
  var output = [];

  job.offset = job.offset || 0;
  var range = 'A' + (job.offset + 1) + ':B';

  for(var i = 0; i < job.jobs.length && job.jobs[i].logs; i++) {
    var logs = job.jobs[i].logs;

    for(var j = 0; j < logs.length; j++) {
      output.push(logs[j]);
    }

    job.jobs[i].logs = [];
  }

  if(output.length > 0) {
    job.offset += output.length;

    sheetDAO.setValues('Log', range + (job.offset), output);
  }

  return job;
}
function writeLogs(job) {
  return _invoke('_writeLogs', job);
}

/**
 * Creates load jobs for items in the feed for a particular entity.
 *
 * params:
 *  job: the job object
 *  job.entity: the name of the entity to use to identify the correct loader to
 *  use
 */
function _createPushJobs(job) {
  var loader = getLoader(job.entity);

  loader.createPushJobs(job);

  return job;
}
function createPushJobs(job) {
  return _invoke('_createPushJobs', job);
}

/**
 * Function that safely tries to parse an input as a JSON object, if it fails it
 * doesn't throw an excaption, rather it just returns the input
 *
 * params:
 *  input: input value to try to parse
 *
 * result: either the json object resulting from parsing input, or input itself
 * if it is not a valid json
 */
function parse(input) {
  try {
    return JSON.parse(input);
  } catch(error) {
    return input;
  }
}

/**
 * Decorator that provides basic error handling for job invocation
 */
function _invoke(functionName, input) {
  try {
    var job = parse(input);

    return JSON.stringify(this[functionName](job));
  } catch(error) {
    console.log(error);
    job.error = error;

    throw JSON.stringify(job);
  }
}
