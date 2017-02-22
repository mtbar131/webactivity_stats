var recordsDictionary = {};
var lastURL = null;

document.addEventListener('DOMContentLoaded', function() {

    loadData();

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	getTabInfo();
    });

    chrome.tabs.onActiveChanged.addListener(function(tabId, selectInfo) {
	getTabInfo();
    });

    chrome.tabs.onRemoved.addListener(function() {
	saveData();
    });

});

function printData() {
    console.log('Here are all values till now\n');
    // for(key in recordsDictionary){
    // 	var stats = recordsDictionary[key];
    // 	console.log('URL: ' + key + ' Data: ' + JSON.stringify(stats, null, 2));
    // }
    console.log(JSON.stringify(recordsDictionary, null, 2));
    console.log('----------------------------\n');    
}

function processEvent(url) {
    if (lastURL != null) {
	var stats = {};
	/* update used time for last active tab */
	stats = recordsDictionary[lastURL];
	stats['timespent'] = new Date().valueOf() - stats['timestamp'];
	recordsDictionary[lastURL] = stats;
    }

    if (!(url in recordsDictionary)) {
	var stats = {};
	stats['count'] = 1;
	stats['timespent'] = 0;
	stats['timestamp'] = new Date().valueOf();
	recordsDictionary[url] = stats;
    } else {
	var stats = recordsDictionary[url];
	stats['count'] = stats['count'] + 1;
	stats['timestamp'] = new Date().valueOf();
	recordsDictionary[url] = stats;
    }
    printData();
    lastURL = url;
}

function getTabInfo() {

    var queryInfo = {
	active: true,
	currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
	// chrome.tabs.query invokes the callback with a list of tabs that match the
	// query. When the popup is opened, there is certainly a window and at least
	// one tab, so we can safely assume that |tabs| is a non-empty array.
	// A window can only have one active tab at a time, so the array consists of
	// exactly one tab.
	var tab = tabs[0];

	if (typeof tab == 'undefined') {
	    console.log('tab is undefined');
	    return;
	}

	if (tab.url == 'chrome://newtab/') {
	    console.log('New tab without url');
	    return;
	}

	// A tab is a plain object that provides information about the tab.
	// See https://developer.chrome.com/extensions/tabs#type-Tab
	var url = tab.url;

	// tab.url is only available if the "activeTab" permission is declared.
	// If you want to see the URL of other tabs (e.g. after removing active:true
	// from |queryInfo|), then the "tabs" permission is required to see their
	// "url" properties.
	console.assert(typeof url == 'string', 'tab.url should be a string');
	
	processEvent(extractDomain(url));
    });
}

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

/* Use chrome.storage.sync.* in case you want to sync all data */
function saveData() {
//    chrome.storage.local.clear();
    chrome.storage.local.set({'records': recordsDictionary}, function() {
        // Notify that we saved.
	printData();
	console.log('Data saved');
    });
}

function loadData() {
    chrome.storage.local.get('records', function(items) {
	recordsDictionary = items.records;
	console.log('Data loaded');
	printData();
    });
}
