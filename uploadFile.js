// variables to store processed data
var participants={
	noOfParticipants:0
};

var messages={
	totalMessages:0,
	totalMedia:0,
	totalEmoji:0,
	totalLinks:0,
	longestMessage:0
};

var words={
	totalWords:0,
	longestWord:"",
	listOfWords:{}
};

var emojis={
	totalEmojis:0,
	listOfEmojis:{}
}

var dateData={
	time:{}, // contains messages sent per hour
	days:{}, // contains message for each day of the week
	months:{}, // contains messgaes for each month
	dates:{}, //contains messages for each date
	noTextDays:0,
	streak:{
		start:"",
		end:"",
		length:0
	},
	conversationLength:0
}; // contain state date end date and number of days

var statistics ={
	msgPerDay:0,
	msgPerMonth:0,
	message:{
		highest:0,
		name:""
	},
	words:{
		highest:0,
		name:""
	},
	emojis:{
		highest:0,
		name:""
	}
};

var sortedData={
	sortedTime:[],
	sortedDays:[],
	sortedMonths:[],
	sortedWords:[],
	sortedEmojis:[]
};

var group={
	isGroup:false,
	creator:"",
	name:"",
	dateCreated:"",
	left:0
}



var lastDate,streakStart,streakEnd,currentStreak=0;
var lastSender=null;

var currentLine=0;

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
		if(i>0 && fileSplit[i].length>0) // skip encryption line
			processLine(fileSplit[i]);
	}
	
	finalProcessing();
	calculateStats();
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
	var sender = null;
	var time = null;
	var message = null;
	var date = null;
	var start=0;
	
	// regular expression to test on each line
	// first bracket matches DATE
	// second bracket matches TIME
	// third bracket SENDER
	// fourth bracket MESSAGE
	var lineRE = /(^\d+\/\d+\/\d+), (\d+:\d{2}\s\D{2}) \- (.*?): (.*)/ 
	
	var testLine = lineRE.exec(line);
	
	if(testLine!==null)
	{
		date= testLine[1];
		time = testLine[2];
		sender = testLine[3];
		message =testLine[4];
	}
	
	
	// get start date
	if(participants.noOfParticipants==0 && date!==null)
	{
		dateData.startDate=date;
	}
	
	if(sender!==null && date!=null)
	{
		// get actual name of sender
		lastSender = sender;
		processSender(sender);
	}
	
	if(message!==null && message.length>0)
	{		
		if(sender===null & lastSender!==null)
			sender = lastSender;
		
		processMessage(message,sender);
	
	}
	
	else if(testLine===null && line.length>0) 
	{
		var creator = null;
		var join = null;
		var query;
		
		if(currentLine<4) // run expression on only first four lines
		{
			query= "created group";
			var creatorRe = /(^\d+\/\d+\/\d+), (\d+:\d{2}\s\D{2}) \- (.*?) created group (.*)/;
			creator = creatorRe.exec(line);
			var joinRe = /joined using this/;
			join = joinRe.exec(line)
			
			currentLine++;
		}
		
		if(creator!==null) // get group creator
		{
			group.creator = creator [3];
			group.name= creator[4];
			group.isGroup = true;
			group.dateCreated=creator[1];
		}
		
		else if(lastSender!==null && join===null) // get lines that don't begin with a sender
		{
			processMessage(line,lastSender);
		}
		
	}
	
	
	
	if(time!==null && date!==null)
	{
		processTime(time,date);
	}
	
	if(date!==null && date!=lastDate)
	{
		lastDate = date;
	}
}



// adds new participant
// counts no of messages per participant
function processSender(sender)
{

	if (participants.hasOwnProperty(sender)===false){ // add sender as participant
		participants[sender]={
			messageCount:1 // intialize message sent by particpant to 1
		}
		participants.noOfParticipants++; // increase count by 1
	}
	
	else
	{
		participants[sender].messageCount++; // increase message count for each participant
	}
}


// splits messgaes into words
// counts number of words and frequency of words
function processMessage(message,sender)
{
	
	message = message.trim();
	
	// check if message indicates someone leaving the group
	if(group.isGroup && checkLeft(message)) // count number of people that left
	{
		group.left++;
	}
	
	// check if the message is just a change of numbe rmessage
	else if(group.isGroup && changedNumber(message)!==false)
	{
		var oldNumber = changedNumber(message)[0];
		var newNumber = changedNumber(message)[1];
		
		// if the old particpant exists
		if(participants.hasOwnProperty(oldNumber))
		{
			participants[newNumber] = participants[oldNumber];
			delete participants[oldNumber];
		}
	}
	
	// check if the message is just media
	else if(message === "<Media omitted>")
	{
		messages.totalMedia++;
	}
	
	else
	{	
		processEmojis(message,sender); // process emojis in the message
		
		var strArray = message.split(/[\s.?\!]+/); // split by space delimiters
		var length = strArray.length;
		
		
		
		// get each word and calculate frequency
		for(var i=0;i<length;i++)
		{
			var word = strArray[i].toLowerCase();
			if(word.length>0)
			{
				// calculate word count for each participant
				if(participants[sender].hasOwnProperty("wordCount")===false)
				{
					participants[sender].wordCount = 1;
				}
				
				else
				{
					participants[sender].wordCount++;
				}
				
				// add words to list of words
				if(words.listOfWords.hasOwnProperty(word)===false && word.length>=3) // if word not in dictionary and is greater than three
				{
					words.listOfWords[word]=1;
				}
				
				else if (words.listOfWords.hasOwnProperty(word) && word.length>=3) // increase the word count for specific word
				{
					words.listOfWords[word]++;
				}
			}
			
			// get longest word
			if(word.length> words.longestWord.length)
			{
				words.longestWord = word;
			}
		}
		
		
		// calculate longest message
		if(length > messages.longestMessage)
		{
			messages.longestMessage = length;
		}
	}
}

function checkLeft(message)
{
	
	var left = null;
	
	var leftRE = /(^\d+\/\d+\/\d+), (\d+:\d{2}\s\D{2}) \- (.*) left$/ ;
	
	left = leftRE.exec(message);
	
	
	if(left===null)
	{
		return false;
	}
	
	else
	{
		return true;
	}
}

function changedNumber(message)
{
	var changed = null;
	
	var changedRE = /(^\d+\/\d+\/\d+), (\d+:\d{2}\s\D{2}) \- (.*) changed to (.*)/
	
	changed = changedRE.exec(message);
	
	if(changed === null)
	{
		return false;
	}
	
	else
	{
		return [changed[3],changed[4]];
	}
}



function processEmojis(message,sender)
{
	//https://medium.com/reactnative/emojis-in-javascript-f693d0eb79fb
	var emojiRe= /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

	var emoji;

	while(emoji=emojiRe.exec(message))
	{
		// attach emoji count to sender
		if(participants[sender].hasOwnProperty("emojiCount")===false)
		{
			participants[sender].emojiCount = 1;
		}
		
		else
		{
			participants[sender].emojiCount++;
		}
		
		if(emojis.listOfEmojis.hasOwnProperty(emoji)===false)
		{
			emojis.listOfEmojis[emoji]=1;
		}
		
		else
		{
			emojis.listOfEmojis[emoji]++;
		}
	}
}

// get hour range in which the most messages are sent
function processTime(time,date)
{
	// split time by ':' delimiter
	var timeSplit = time.split(":"); // get numbers
	var timeOfDay = time.split(" "); // get am or pm
	var AMPM = timeOfDay[1].toUpperCase();
	
	// split date by '/' delimiters
	var dateSplit = checkDate(date);
	var monthYear = getMonth(dateSplit[1])+ " " +(dateSplit[2].length<4?" 20"+dateSplit[2]:dateSplit[2]); // get month and year format (MMM YY)
	
	
	var day = getDay(dateSplit); // get day of the week
	
	// increase no of messages sent on a particular date
	if(dateData.dates.hasOwnProperty(date)===false)
	{
		dateData.dates[date]=1;
	}
	
	else
	{
		dateData.dates[date]++;
	}
	
	// increase no of messages  sent at a particular time
	if(dateData.time.hasOwnProperty(timeSplit[0]+" "+AMPM)===false)
	{
		dateData.time[timeSplit[0]+" "+AMPM]=1; //hh am/pm
	}
	
	else
	{
		dateData.time[timeSplit[0]+" "+AMPM]++;
	}
	
	// increase no of messages sent in a particular month
	if(dateData.months.hasOwnProperty(monthYear)===false)
	{
		dateData.months[monthYear]=1;
	}
	
	else
	{
		dateData.months[monthYear]++;
	}
	
	// no of messages for specific days of the week
	if(dateData.days.hasOwnProperty(day)===false)
	{
		dateData.days[day]=1;
	}
	
	else
	{
		dateData.days[day]++;
	}
	
	// calculate streak
	//******* fix this
	if(currentStreak===0) // iniitalize streal
	{
		startStreak=date;
		currentStreak++;
		//console.log("i am here");
	}
	
	else if(currentStreak!==0 && date!=lastDate) // if date changes
	{
		
		if(dateDiff(lastDate,date)===1)// if it's the next day
		{
			currentStreak++;
		}
		
		else if (dateDiff(lastDate,date)>1)
		{
			if(currentStreak>dateData.streak.length)
			{
				dateData.streak.length = currentStreak;
				dateData.streak.start = startStreak;
				dateData.streak.end = date;
				
				currentStreak=0;
			}
			
			// use diff as number of days no text was sent
			dateData.noTextDays+=(dateDiff(lastDate,date)-1);
		}
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


//// *** TIME RELATED FUNCTIONS
function getMonth(num)
{
	var month = new Array(12);
	month[0]= "January";
	month[1]= "February";
	month[2]= "March";
	month[3]= "April";
	month[4]= "May";
	month[5]= "June";
	month[6]= "July";
	month[7]= "August";
	month[8]= "September";
	month[9]= "October";
	month[10]= "November";
	month[11]= "December";
	
	return month[num-1];
}

function getDay(date)
{
	var dateObject = new Date(date[2],date[1],date[0]);
	var day = dateObject.getDay();
	
	var weekday = new Array(7);
	weekday[0] =  "Sunday";
	weekday[1] = "Monday";
	weekday[2] = "Tuesday";
	weekday[3] = "Wednesday";
	weekday[4] = "Thursday";
	weekday[5] = "Friday";
	weekday[6] = "Saturday";
	
	return weekday[day];
}

function dateDiff(prev, curr)
{
	var newPrev= checkDate(prev);
	var newCurr = checkDate(curr);
	
	var date1 = new Date(newPrev[2].length<4?"20"+newPrev[2]:newPrev[2],newPrev[1]-1,newPrev[0]);
	var date2 = new Date(newCurr[2].length<4?"20"+newCurr[2]:newCurr[2],newCurr[1]-1,newCurr[0]);
	var timeDiff = Math.abs(date2.getTime() - date1.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
	
	return diffDays;
}

function checkDate(passedDate)
{
	var splitDate;
	var date,month,year

	var date1 = /\d+\/\d+\/\d{4}/;
	var date2 = /\d+\/\d+\/\d{2}/;
	
	// check MM/DD/YYYY
	if(date1.exec(passedDate)!==null)
	{
		splitDate= passedDate.split("/");
		date = parseInt(splitDate[0]);
		month = parseInt(splitDate[1]);
		year= parseInt(splitDate[2]);
	}
	
	// check DD/MM/YY
	else if(date2.exec(passedDate)!==null)
	{
		splitDate= passedDate.split("/");
		date = parseInt(splitDate[1]);
		month = parseInt(splitDate[0]);
		year= parseInt(splitDate[2]);
	}
	
	return([date,month,year]);
}

// uses values already gotten to calculate derived values
function finalProcessing()
{
	// get total messages & words by adding word count for each participant
	var totalMessages=0;
	var totalWords=0;
	var totalEmojis=0;
	for (var partcipant in participants)
	{
		if(participants[partcipant].hasOwnProperty("messageCount"))
		{
			totalMessages+=participants[partcipant].messageCount;
			
			//get name and count of person with hihest messages
			if(participants[partcipant].messageCount > statistics.message.highest)
			{
				statistics.message.highest = participants[partcipant].messageCount;
				statistics.message.name = partcipant;
			}
		}
		
		if(participants[partcipant].hasOwnProperty("wordCount"))
		{
			totalWords+=participants[partcipant].wordCount;
			
			//get name and count of person with hihest messages
			if(participants[partcipant].wordCount > statistics.words.highest)
			{
				statistics.words.highest = participants[partcipant].wordCount;
				statistics.words.name = partcipant;
			}
		}
		
		if(participants[partcipant].hasOwnProperty("emojiCount"))
		{
			totalEmojis+=participants[partcipant].emojiCount;
			
			//get name and count of person with hihest messages
			if(participants[partcipant].emojiCount > statistics.emojis.highest)
			{
				statistics.emojis.highest = participants[partcipant].emojiCount;
				statistics.emojis.name = partcipant;
			}
		}
	}
	
	// assign values to appropriate entities
	messages.totalMessages = totalMessages;
	words.totalWords = totalWords;
	emojis.totalEmojis = totalEmojis;
	
	// get final date values
	dateData.endDate=lastDate;
	
	// if streak is at end of file
	if(currentStreak> dateData.streak.length)
	{
		dateData.streak.length = currentStreak;
		dateData.streak.start = startStreak;
		dateData.streak.end = lastDate;
		
		currentStreak=0;
	}
	
	// get length of conversation
	dateData.conversationLength =dateDiff(dateData.startDate,dateData.endDate);
	
	// sort specific data
	sortedData.sortedTime = sortObjectValue(dateData.time);
	sortedData.sortedDays = sortObjectValue(dateData.days);
	sortedData.sortedMonths = sortObjectValue(dateData.months);
	sortedData.sortedEmojis = sortObjectValue(emojis.listOfEmojis);

	//console.log(participants);
	//console.log(messages);
	//console.log(words);
	//console.log(dateData);
	//console.log(sortedData);
}

function calculateStats()
{
	statistics.msgPerDay = Math.floor(messages.totalMessages/(Math.abs(dateData.conversationLength-dateData.noTextDays)));
	statistics.msgPerMonth = Math.floor((messages.totalMessages/(dateData.conversationLength/30)));
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
		
		printDuration();
		printOverview();
		printMessageAnalysis();
		printTimeAnalysis();
		printEmojiAnalysis();
		//printWordsAnalysis()
		googleApi();
	}
}

function printDuration()
{
	$("#time").html(dateData.startDate+" - "+dateData.endDate);
}

function printOverview()
{	
	//set number of participants
	$("#noOfParticpants").html(participants.noOfParticipants.toLocaleString());
	
	// set number of messages
	$("#noOfMessages").html(messages.totalMessages.toLocaleString());
	
	// set number of words
	$("#noOfWords").html(words.totalWords.toLocaleString());
	
	//set avg messages per day
	$("#avgMessagesDay").html(statistics.msgPerDay.toLocaleString());
	
	// set avg messages per month
	$("#avgMessagesMonth").html(statistics.msgPerMonth.toLocaleString());
	
	// set streak
	$("#streak").html(dateData.streak.length+" days");
	
	//set media
	$("#noOfMedia").html(messages.totalMedia.toLocaleString())
	
	// set emojis
	$("#noOfEmojis").html(emojis.totalEmojis);
	
	// overview to add if it's a group
	if(group.isGroup)
	{
		// add creator
		$("#groupCreator").removeClass("hide");
		$("#creator").html(group.creator);
		
		
		// add group name
		$("#groupName").removeClass("hide");
		$("#nameOfGroup").html(group.name);
		
		// users that left
		$("#exits").removeClass("hide");
		$("#noOfExits").html(group.left);
	}
}

function printMessageAnalysis()
{
	// append value of most messages
	$('#mostMessages').append(statistics.message.highest.toLocaleString());
	
	// name of most messgaes
	$('#mostMessagesPartcipant').html(statistics.message.name);
	
	// append value for maost words
	$('#mostWords').append(statistics.words.highest.toLocaleString());
	
	// name of most words
	$('#mostWordsPartcipant').html(statistics.words.name);
	
}

function partcipantAnalysis()
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
	// hour analysis
	var lengthHour = sortedData.sortedTime.length;
	$("#busyHour").append(sortedData.sortedTime[0][0]);
	$("#silentHour").append(sortedData.sortedTime[lengthHour-1][0]);
	
	// day analysis
	var lengthDay = sortedData.sortedDays.length;
	$("#busyDay").append(sortedData.sortedDays[0][0]);
	$("#silentDay").append(sortedData.sortedDays[lengthDay-1][0]);
	
	// month analysis
	var lengthMonths = sortedData.sortedMonths.length;
	$("#busyMonth").append(sortedData.sortedMonths[0][0]);
	$("#silentMonth").append(sortedData.sortedMonths[lengthMonths-1][0]);
	
}

function printEmojiAnalysis()
{
	$('#mostEmojis').append(statistics.emojis.highest);
	$('#mostEmojisName').append(statistics.emojis.name);
}

// call google api
function googleApi()
{
	google.charts.load("current", {packages:["corechart"]});
	google.charts.load("current", {packages:["calendar"]});
    google.charts.setOnLoadCallback(drawMessagePieChart);
	google.charts.setOnLoadCallback(drawCountPieChart);
	//google.charts.setOnLoadCallback(drawBarChartWords);
	google.charts.setOnLoadCallback(drawBarChartTime);
	google.charts.setOnLoadCallback(drawBarChartDays);
	google.charts.setOnLoadCallback(drawBarChartMonths);
	google.charts.setOnLoadCallback(drawCalendarChart);
	google.charts.setOnLoadCallback(drawEmojiChart);
}


// draw messsage pie chart
function drawMessagePieChart()
{
	var data = new google.visualization.DataTable();
	data.addColumn('string', 'Name');
    data.addColumn('number', 'Messages');
	
	for(var participant in participants)
	{
		if(participants[participant].hasOwnProperty("messageCount"))
		{
			data.addRow([participant, participants[participant].messageCount]);
		}
	}

	var options={
		height:300,
		width:300,
		pieHole:0.4,
		slices:{
		 0:{color:'black'},
		 1:{color:'grey'}
		},
		legend: 'none',
		sliceVisibilityThreshold: .08,
		fontName:'Orbitron'
	};

	var chart = new google.visualization.PieChart(document.getElementById('messageCountChart'));
	chart.draw(data, options);
}

// draw words pie chart
function drawCountPieChart()
{
	var data = new google.visualization.DataTable();
	data.addColumn('string', 'Name');
    data.addColumn('number', 'Messages');
	
	for(var participant in participants)
	{
		if(participants[participant].hasOwnProperty("messageCount"))
		{
			data.addRow([participant, participants[participant].wordCount]);
		}
	}

	var options={
		height:300,
		width:300,
		pieHole:0.4,
		slices:{
		 0:{color:'black'},
		 1:{color:'grey'}
		},
		legend: 'none',
		sliceVisibilityThreshold: .08,
		fontName:'Orbitron'
	};

	var chart = new google.visualization.PieChart(document.getElementById('wordsCountChart'));
	chart.draw(data, options);
}

function drawBarChartTime()
{
	var data = new google.visualization.DataTable();
	
	// add table info
	data.addColumn('string', 'Time');
    data.addColumn('number', 'NO OF MESSAGES');
	data.addColumn({type: 'string', role: 'style'});
	
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
		height:400,
		width:750,
		bar: {groupWidth: "50%"},
		legend: { position: "none" },
		fontName:'Orbitron'
    };
	
	var chart = new google.visualization.ColumnChart(document.getElementById("messageHourChart"));
    chart.draw(data,options);
}

function drawBarChartDays()
{
	var data = new google.visualization.DataTable();
	
	// add table info
	data.addColumn('string', 'Day');
    data.addColumn('number', 'NO OF MESSAGES');
	data.addColumn({type: 'string', role: 'style'});
	
	data.addRow(["Sunday", dateData.days["Sunday"], 'black']);
	data.addRow(["Monday", dateData.days["Monday"], 'black']);
	data.addRow(["Tuesday", dateData.days["Tuesday"], 'black']);
	data.addRow(["Wednesday", dateData.days["Wednesday"], 'black']);
	data.addRow(["Thursday", dateData.days["Thursday"], 'black']);
	data.addRow(["Friday", dateData.days["Friday"], 'black']);
	data.addRow(["Saturday", dateData.days["Saturday"], 'black']);
	
	var options = {
		height:400,
		width:750,
		bar: {groupWidth: "50%"},
		legend: { position: "none" },
		fontName:'Orbitron'
    };
	
	var chart = new google.visualization.BarChart(document.getElementById("messageDayChart"));
    chart.draw(data,options);
	
}

function drawBarChartMonths()
{
	var data = new google.visualization.DataTable();
	
	// add table info
	data.addColumn('string', 'Month');
    data.addColumn('number', 'NO OF MESSAGES');
	data.addColumn({type: 'string', role: 'style'});
	
	for(var month in dateData.months)
	{
		data.addRow([month,dateData.months[month],'black']);
	}
	
	var options = {
		height:400,
		width:750,
		bar: {groupWidth: "50%"},
		legend: { position: "none" },
		fontName:'Orbitron'
    };
	
	var chart = new google.visualization.ColumnChart(document.getElementById("messageMonthChart"));
    chart.draw(data,options);
}

function drawCalendarChart()
{
	var data = new google.visualization.DataTable();
	data.addColumn('date', 'Date');
    data.addColumn('number', 'NO OF MESSAGES');
	
	for (var date in dateData.dates)
	{
		var splitDate = checkDate(date);
		var day = splitDate[0];
		var month = splitDate[1];
		var year = splitDate[2]+"";
		
		
		var newYear = (year.length<4)?("20"+year):year;
		
		data.addRow([new Date(newYear,parseInt(month)-1,parseInt(day)),dateData.dates[date]]);
	}
	
	var options = {
		height:450,
		legend: { position: "none" },
		fontName:'Orbitron',
		calendar: {
		  dayOfWeekLabel: {
			fontName: 'Orbitron',
			color: 'black',
		  },
		  monthLabel: {
			fontName: 'Orbitron',
			color: 'black',
		  },
		 
		}
    };
	
	var chart =  new google.visualization.Calendar(document.getElementById("calendarChart"));
    chart.draw(data,options);
}

function drawEmojiChart()
{
	var data = new google.visualization.DataTable();
	data.addColumn('string', 'Emoji');
    data.addColumn('number', 'Count');
	
	for(var emoji in emojis.listOfEmojis)
	{
		
		data.addRow([emoji, emojis.listOfEmojis[emoji]]);
		
	}

	var options={
		height:300,
		width:300,
		pieHole:0.4,
		slices:{
		 0:{color:'black'},
		 1:{color:'grey'}
		},
		legend: 'none',
		sliceVisibilityThreshold: .015,
		fontName:'Orbitron',
		pieSliceText:'label',
		pieSliceTextStyle:{
			fontSize:15
		}
	};

	var chart = new google.visualization.PieChart(document.getElementById('emojiChart'));
	chart.draw(data, options);
}



