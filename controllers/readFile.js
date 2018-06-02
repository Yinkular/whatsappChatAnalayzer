// RE variable signifies regular expressions

var participants={};
var messageCount; // count total Messages, count messages per participant
var wordFrequency={};
var dateData={time:{}}; // contain state date end date and number of days
var count=0;
var lastDate;


function readFile(inputFile)
{
	var fs = require('fs');
	readline = require('readline');
	instream = fs.createReadStream(inputFile);
	rl = readline.createInterface(instream);
     
    rl.on('line', function (line) {
        //console.log(line); // call function to process each line here
		processLine(line);
    });
    
    rl.on('close', function () {
		dateData.endDate = lastDate[0];
        console.log(participants);
		//var keySorted = sortObjectKey(wordFrequency);
		//console.log(keySorted);
		var valueSorted = sortObjectValue(wordFrequency);
		console.log(valueSorted);
		console.log(dateData);
    });
}

function processLine(line)
{
	var sender;
	var time;
	var message;
	var date;
	
	var dateRE = /\d{2}\/\d{2}\/\d{2}/; // regular expression for date matches "mm/dd/yy"
	var timeRE = /\d+:\d{2}\s\D{2}/; // regular expression for time matches "h|hh:mm am|pm"
	var senderRE =/-\s\w+\s*\w*:/; // regular expression for sender 
	var messageRE = /:\s+[\w\s,;\.'?\\"\x00-\xFF]+/;//regular expression to match messgae ** fix later
	
	// execute regular expressions
	date = dateRE.exec(line);
	time = timeRE.exec(line);
	sender = senderRE.exec(line);
	message = messageRE.exec(line);
	
	if(sender!==null)
	{
		// get actual name of sender
		var length = sender[0].length;
		sender=sender[0].substring(2,length-1);
		
		//console.log(sender);
		processSender(sender);
	}
	
	if(message!==null && sender!=null)
	{
		processMessage(message,sender);
		//console.log(message[0]);
	}
	
	if(count==0 && date!==null)
	{
		dateData.startDate=date[0];
	}
	
	if(time!==null)
	{
		count++;
		processTime(time[0]);
	}
	
	if(date!==null)
	{
		lastDate = date;
	}
}

function processSender(sender)
{

	if (participants.hasOwnProperty(sender)===false){ // create initial property in participants
		participants[sender]={
			messageCount:1
		}
	}
	
	else
	{
		participants[sender].messageCount++; // increase message count for each participant
	}
}

function processMessage(message,sender)
{
	// split message by space get only alpha chaarcters analyze
	
	message = message+'';
	
	var strArray = message.split(/[\s.?]+/); // split by space ? .
	var length = strArray.length;
	
	// calculate word count for each participant
	if(participants[sender].hasOwnProperty("wordCount")===false)
	{
		participants[sender].wordCount = length;
	}
	
	else
	{
		participants[sender].wordCount+=length;
	}
	
	// get each word and calculate frequency
	for(var i=0;i<length;i++)
	{
		var word = strArray[i].toLowerCase();
		if(wordFrequency.hasOwnProperty(word)===false && word.length>3) // if word not in dictionary and is greater than three
		{
			wordFrequency[word]=1;
		}
		
		else if (wordFrequency.hasOwnProperty(word) && word.length>3) // increase the word count for specific word
		{
			wordFrequency[word]++;
		}
	}
	
}

// get hour range in which the most messages are sent
function processTime(time)
{
	// split time by ':' delimiter
	var timeSplit = time.split(":");
	
	// use the first side has property
	if(dateData.time.hasOwnProperty(timeSplit[0])===false)
	{
		dateData.time[timeSplit[0]]=1;
	}
	
	else
	{
		dateData.time[timeSplit[0]]++;
	}
}

// returns an object
function sortObjectKey(obj) {
    return Object.keys(obj).sort().reduce(function (result, key) {
        result[key] = obj[key];
        return result;
    }, {});
}

// copied from **https://gist.github.com/umidjons/9614157
// retruns an array sorted in descending order
function sortObjectValue(obj)
{
  // convert object into array
	var sortable=[];
	for(var key in obj)
		if(obj.hasOwnProperty(key))
			sortable.push([key, obj[key]]); // each item is an array in format [key, value]
	
	// sort items by value
	sortable.sort(function(a, b)
	{
	  return b[1]-a[1]; // compare numbers
	});
	return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}




readFile("../public/texts/fullTest.txt");
