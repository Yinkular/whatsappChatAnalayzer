var participants={};
var messageCount; // count total Messages, count messages per participant
var wordFrequency={};
var sortedFrequencyValue;
var dateData={time:{}}; // contain state date end date and number of days
var count=0;
var lastDate;
var lastSender;
var numberOfParticipants=0;
var participantArray=[];
var timeArray;

$(document).ready(function()
{
	var fileSelector = $('#uploadFile');
	
	// if file selector is used
	fileSelector.change(function()
	{
		var file = $('#uploadFile')[0].files;
		
		handleFile(file[0]);
	});
	
});

// function to handle file
function handleFile(file)
{
	if(file.length===0 || file.length>1 || !validFile(file)) // make sure a single file is uploaded and is of correct type
	{
		$('.uploadLabel').addClass('error');
	}
	
	else
	{
		$('.uploadLabel').addClass('success');	
		var reader = new FileReader();
		
		reader.onload = processFile;
		
		reader.readAsText(file);
	}
}

function validFile(file)
{
	if(file.type === "text/plain")
		return true;
	
	return false
}

function returnFileSize(number) {
  if(number < 1024) {
    return number + 'bytes';
  } else if(number >= 1024 && number < 1048576) {
    return (number/1024).toFixed(1) + 'KB';
  } else if(number >= 1048576) {
    return (number/1048576).toFixed(1) + 'MB';
  }
}

function processFile(e)
{
	var file = e.target.result;
	var fileSplit = file.split("\n") // split based on new line
	//console.log(fileSplit.length);
	
	for(var i=0;i<fileSplit.length;i++)
	{
		processLine(fileSplit[i]);
	}
	
	dateData.endDate = lastDate[0];
	//console.log(participants);
	//var keySorted = sortObjectKey(wordFrequency);
	//console.log(keySorted);
	sortedFrequencyValue = sortObjectValue(wordFrequency);
	//console.log(sortedFrequencyValue);
	//console.log(dateData);
	//console.log(numberOfParticipants);
	
	// start showing details
	alterDisplay();
}

//*********************************************************************
//*********************************************************************
//*********************************************************************
//*********************************************************************
//*********************************************************************
//*********************************************************************


// MAJOR PROCESSING

function processLine(line)
{
	var sender;
	var time;
	var message;
	var date;
	
	var dateRE = /\d+\/\d+\/\d{2}/; // regular expression for date matches "mm/dd/yy"
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
		sender=sender[0].substring(2,length-1).toUpperCase();
		
		lastSender = sender;
		processSender(sender);
	}
	
	if(message!==null && sender!==null)
	{
		processMessage(message,sender);
	}
	
	// if line doesn't contain a sender but has message
	// use last sender
	else if(message!==null && sender===null)
	{
		processMessage(message,lastSender);
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
		numberOfParticipants++;
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
	var timeOfDay = time.split(" ");
	
	// use the first side has property
	if(dateData.time.hasOwnProperty(timeSplit[0]+" "+timeOfDay[1])===false)
	{
		dateData.time[timeSplit[0]+" "+timeOfDay[1]]=1;
	}
	
	else
	{
		dateData.time[timeSplit[0]+" "+timeOfDay[1]]++;
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
// returns an array sorted in descending order
function sortObjectValue(obj)
{
  // convert object into array
	var sortable=[];
	for(var key in obj)
		if(obj.hasOwnProperty(key))
			sortable.push([key, obj[key]]); // each item is an array in format [key, value]
	
	// sort items by value
	sortable.sort                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               (function(a, b)
	{
	  return b[1]-a[1]; // compare numbers
	});
	return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}

// ** https://stackoverflow.com/questions/38824349/convert-object-to-array-in-javascript
function objToArray(obj)
{
	var result = Object.keys(obj).map(function(key) {
		return [String(key), obj[key]];
	});
	
	return result;
}


//*********************************************************************
//*********************************************************************
//*********************************************************************
//*********************************************************************
//*********************************************************************
//*********************************************************************



// PRINT OUTPUT
// removes upload button and replaces with analysis area
function alterDisplay()
{
	$('.uploadArea').addClass("hide"); // remove upload button **fix later to adjust to the top
	
	if($('#analysisArea').hasClass('hide'))
	{
		$('#analysisArea').removeClass('hide');
		
		printParticipantAnalysis();
		printWordsAnalysis()
		googleApi();
	}
}

function printParticipantAnalysis()
{	
	var pId=0;
	for(var participant in participants)
	{
		pId++;
		var name = participant;
		var messageCount = participants[name].messageCount;
		var wordCount = participants[name].wordCount;
		
		$("#participant"+pId).html(name);
		$("#participant"+pId+"-MC").html(messageCount);
		$("#participant"+pId+"-WC").html(wordCount);
		
		participantArray.push([name,messageCount,wordCount]);
	}
}

function printWordsAnalysis()
{
	var wordsLength = sortedFrequencyValue.length;
	var modalWord = sortedFrequencyValue[0][0];
	

	$('#uniqueWord').append("~"+wordsLength);
	$('#modalWord').append('"'+modalWord+'"');
}

function printTimeAnalysis()
{
}

// call google api
function googleApi()
{
	google.charts.load("current", {packages:["corechart"]});
    google.charts.setOnLoadCallback(drawMessagePieChart);
	google.charts.setOnLoadCallback(drawCountPieChart);
	google.charts.setOnLoadCallback(drawBarChartWords);
	google.charts.setOnLoadCallback(drawBarChartTime);
}


// draw messsage pie chart
function drawMessagePieChart()
{
	var data = google.visualization.arrayToDataTable([
		['Name', 'Message Count'],
		[participantArray[0][0], participantArray[0][1]],
		[participantArray[1][0], participantArray[1][1]]
		]);

	var options={
		title: "Messages",
		pieHole:0.4,
		slices:{
		 0:{color:'black'},
		 1:{color:'grey'}
		}
	};

	var chart = new google.visualization.PieChart(document.getElementById('messagePie'));
	chart.draw(data, options);
}

// draw words pie chart
function drawCountPieChart()
{
	var data = google.visualization.arrayToDataTable([
		['Name', 'Word Count'],
		[participantArray[0][0], participantArray[0][2]],
		[participantArray[1][0], participantArray[1][2]]
		]);

	var options={
		title: "Words",
		pieHole:0.4,
		slices:{
		 0:{color:'black'},
		 1:{color:'grey'}
		}
	};

	var chart = new google.visualization.PieChart(document.getElementById('wordPie'));
	chart.draw(data, options);
}

function drawBarChartWords()
{
	var data = new google.visualization.DataTable();
	
	data.addColumn('string', 'Word');
    data.addColumn('number', 'Frequency');
	data.addColumn({type: 'string', role: 'style'});
	
	
	for(var i=0;i<10;i++)
	{
		data.addRow([sortedFrequencyValue[i][0], sortedFrequencyValue[i][1], 'black']);
	}

	var options = {
        title: "FREQUENCY OF WORDS",
        bar: {groupWidth: "70%"},
        legend: { position: "none" },
    };
	
	var chart = new google.visualization.ColumnChart(document.getElementById("wordsBar"));
    chart.draw(data,options);
}

function drawBarChartTime()
{
	
	var data = new google.visualization.DataTable();
	
	// add table info
	data.addColumn('string', 'Time');
    data.addColumn('number', 'NO OF MESSAGES');
	data.addColumn({type: 'string', role: 'style'});
	
	// add data to table
	//for(time in dateData.time)
	//{
	//	data.addRow([time,dateData.time[time],'black']);
	//}
	
	 data.addRow(["12 AM", dateData.time["12 AM"], 'black']);
	 data.addRow(["1 AM", dateData.time["1 AM"], 'black']);
	 data.addRow(["2 AM", dateData.time["2 AM"], 'black']);
	 data.addRow(["3 AM", dateData.time["3 AM"], 'black']);
	 data.addRow(["4 AM", dateData.time["4 AM"], 'black']);
	 data.addRow(["5 AM", dateData.time["5 AM"], 'black']);
	 data.addRow(["6 AM", dateData.time["6 AM"], 'black']);
	 data.addRow(["7 AM", dateData.time["7 AM"], 'black']);
	 data.addRow(["8 AM", dateData.time["8 AM"], 'black']);
	 data.addRow(["9 AM", dateData.time["9 AM"], 'black']);
	 data.addRow(["10 AM", dateData.time["10 AM"], 'black']);
	 data.addRow(["11 AM", dateData.time["11 AM"], 'black']);
	 data.addRow(["12 PM", dateData.time["12 PM"], 'black']);
	 data.addRow(["1 PM", dateData.time["1 PM"], 'black']);
	 data.addRow(["2 PM", dateData.time["2 PM"], 'black']);
	 data.addRow(["3 PM", dateData.time["3 PM"], 'black']);
	 data.addRow(["4 PM", dateData.time["4 PM"], 'black']);
	 data.addRow(["5 PM", dateData.time["5 PM"], 'black']);
	 data.addRow(["6 PM", dateData.time["6 PM"], 'black']);
	 data.addRow(["7 PM", dateData.time["7 PM"], 'black']);
	 data.addRow(["8 PM", dateData.time["8 PM"], 'black']);
	 data.addRow(["9 PM", dateData.time["9 PM"], 'black']);
	 data.addRow(["10 PM", dateData.time["10 PM"], 'black']);
	 data.addRow(["11 PM", dateData.time["11 PM"], 'black']);
	
	var options = {
		title: "TIME/MESSAGE FREQUENCY",
		bar: {groupWidth: "70%"},
		legend: { position: "none" },
    };
	
	var chart = new google.visualization.ColumnChart(document.getElementById("timeBar"));
    chart.draw(data,options);
}

