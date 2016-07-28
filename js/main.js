/**
 * Project 3: SPA
 * ====
 *
 * See the README.md for instructions
 */

(function() {
	// Container where the records will be shown
	var container = document.querySelector('#container');
	// Panel that is hidden by default and shown to Add/Edit the record
	var detailsPanel = document.querySelector('#detailsPanel');
	
	// Initialize Firebase
	var config = {
		apiKey: "AIzaSyDZVyynkwjdzhZR-dDXzFaHJ6kUlT7xKFg",
		authDomain: "single-page-app-f7cc1.firebaseapp.com",
		databaseURL: "https://single-page-app-f7cc1.firebaseio.com",
		storageBucket: "single-page-app-f7cc1.appspot.com",
	};
	firebase.initializeApp(config);
	
	// Get records from firebase
	renderAll();
	
	
})();

// makes a call to a third-party server and gets records
function getFromServer() {	
	// define a variable XMLHttpRequest object
	var xmlhttp;
	if (window.XMLHttpRequest) {
		// if browser supports, assign new XMLHttpRequest object
		xmlhttp = new XMLHttpRequest();
	} else {
		// if not supported (IE6, IE5) assign new ActiveXObject
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	// define what kind of request and where it has to call
	xmlhttp.open("GET", "https://jsonplaceholder.typicode.com/todos", false);
	// onreadystatechange event is fired each time request change it's status, we assign a function that will be called each time
	xmlhttp.onreadystatechange = function() {
		// readyState == 4 means that the request is completed
		// status == 200 means that it was compelted without errors
		// if both conditions are true we proceed
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			// xmlhttp.responseText is the content that we have from the server
			// we convert it to json object to handle it, it is already well formatted, otherwise convertion will fail
			var jsonList = JSON.parse(xmlhttp.responseText);
			// jsonList is an array of objects and we loop for each object in it
			for (var key in jsonList){
				// let's assume that we need only tasks for user number 1, it can be avoided, but it will make the list too long
				if(jsonList[key].userId==1){
					// define the data to be created on firebase
					var data = {
						title: jsonList[key].title,
						completed: jsonList[key].completed
					};
					// create the record on firebase
					firebase.database().ref('todos/').push(data);
				}
			}
			// once created all the records refresh the list on the page
			renderAll();
		}
	};
	// initiate the request, after it it will fire onreadystatechange event
	xmlhttp.send();
}

// gets all the records from firebase and shows them on the page, it will replace the content on the page, doing so we have the updated list each time
function renderAll() {	
	console.log('renderAll start'); // optionally create log for debugging the script
	// create html that will be shown while the data is being loaded from firebase
	loadingHtml = '\
	  <div class="list-group-item active loading">\
		loading ...\
	  </div>\
	';
	// place the loading html in the container, it will replace the list if it's already loaded
	container.innerHTML = loadingHtml; 
	// get todos from firebase
	firebase.database().ref('todos/').once('value').then(function(snapshot) {
		// it returns a snapshot object, that contains list of objects or empty
		if(!snapshot.val() || snapshot.val().length==0){
			// if it's empty show the Empty message in the container, it wil replace the loading message
			loadingHtml = '\
			  <div class="list-group-item active">\
				Empty\
			  </div>\
			';
			container.innerHTML = loadingHtml; 
		}
		else {
			// otherwise loop the array
			for (var key in snapshot.val()){
				// render object for each record in the array 
				render(key, snapshot.val()[key], container);
			}
		}
		console.log('renderAll end');// create log
	});
}

// renders single record, it takes 3 params
// key - the key of the record on firebase, to be used to identify the record
// data - object from the firebase
// into - the container where it will be rendered, it's always the same container in this case, can be avoided
function render(key, data, into) {
	// assing html button to a variable
	// if completed it will have green label, when clicked it will change completed to false
	// if not completed it will have red label. when clicked it will change completed to true
	completed = data.completed ? '<a class="label label-success" onclick="changeCompleted(\''+key+'\',false)">Completed</a>' : '<a class="label label-danger" onclick="changeCompleted(\''+key+'\',true)">Not completed</a>';
	// for simplicity create the html string that will be added in the container
	// you can create a multiline string by adding backslash (\) at the end of each line, this will help you format the html clearly
	// each item has its own container defined by id to make it unique (id="todo-item-'+key+'")
	// it has "data-completed" attribute to be used later on edit
	// it has edit and delete buttons that call the defined functions
	html = '\
		<div id="todo-item-'+key+'" class="list-group-item" data-completed="'+ data.completed +'">\
		  <p class="list-group-item-text">'+ completed +'</p>\
		  <h4 class="list-group-item-heading data-title">'+ data.title +'</h4>\
		  <p class="list-group-item-text"><button type="button" class="btn btn-sm btn-primary" onclick="editAddTodo(\''+key+'\')">Edit</button> <button type="button" class="btn btn-sm btn-danger" onclick="deleteTodo(\''+key+'\')">Delete</button></p>\
		</div>\
	';
	// check if the main container has the loading message, if so remove it
	loadingElm = document.querySelector('#container .loading');
	if(loadingElm) loadingElm.remove();
	// add the created html to the main container
	into.innerHTML += html; 
}

// opens the hidden panel and fills with the existing data in case of edit, or empty in case of adding
// parameter "key" is the key of the existing record in case of edit, or empty string in case of new record
function editAddTodo(key) {
	console.log('editAddTodo' + ': key => '+ key); // log
	// show the panel
	detailsPanel.style.display = "block";
	// get title element of the panel
	titleElm = detailsPanel.querySelector('h3'); 
	// set the title of the panel, new or edit depending on "key" parameter
	titleElm.innerHTML = key=="" ? "Add New Todo" : "Edit Todo"; 
	// set the key of the item being edited or empty if new
	document.getElementById('todo-key').value = key; 
	// set the title to be edited taken from the container of the item or empty if new
	// document.querySelector('#todo-item-'+key+' .data-title') is the <h4 class="list-group-item-heading data-title">'+ data.title +'</h4> element within the html created in render(key, data, into) function
	document.getElementById('todo-title').value = key!="" ?  document.querySelector('#todo-item-'+key+' .data-title').innerHTML : "";
	// set the completed value to be edited taken from the container of the item or false if new
	document.getElementById('todo-completed').value = key!="" ?  document.querySelector('#todo-item-'+key).getAttribute("data-completed") : "false"; 
}

// submit the new or edited data to firebase
function submitTodo() {
	// hide the panel
	detailsPanel.style.display = 'none';
	// take the key, empty for new record
	key = document.getElementById('todo-key').value;
	console.log('submitTodo' + ': key => '+ key); // log
	// create data to be submitted
	var data = {
		title: document.getElementById('todo-title').value,
		completed: document.getElementById('todo-completed').value=="true"
	};
	// if key is empty submit a new record or update the old one if being edited
	if(key=="")
		firebase.database().ref('todos/').push(data);
	else
		firebase.database().ref('todos/' + key).update(data);
	// once submitted refresh the list on the page
	renderAll();
}

// deletes the record by key
function deleteTodo(key) {
	// confirm the delete, to avoid accident clicks
	if(!confirm('Delete without possibility to restore?')) return;
	// remove the key from firebase
	firebase.database().ref('todos/' + key).remove();
	console.log('deleteTodo' + ': key => '+ key); // log
	// once deleted refresh the list on the page
	renderAll();
}

// deletes all the records on firebase
function deleteAll() {
	// confirm the delete, to avoid accident clicks
	if(!confirm('Delete without possibility to restore?')) return;
	// remove all the records from firebase
	firebase.database().ref('todos/').remove();
	console.log('Clear All' + ''); // log
	// once deleted refresh the list on the page
	renderAll();
}

// changes the completed value for one record
// key - the key of the record being updated
// completed - the value to set, true or false
function changeCompleted(key, completed) {
	console.log(key + ': completed => '+ completed); // log
	// update the completed value for the specific key
	firebase.database().ref('todos/' + key).update({
		completed: completed
	});
	// once updated refresh the list on the page
	renderAll();
}

// changes the completed value for all records
// completed - the value to set, true or false
function changeCompletedAll(completed) {
	console.log('changeCompletedAll: completed => '+ completed); // log
	// create html that will be shown while the data is being loaded from firebase
	loadingHtml = '\
	  <div class="list-group-item active loading">\
		loading ...\
	  </div>\
	';
	// place the loading html in the container, it will replace the list if it's already loaded
	container.innerHTML = loadingHtml; 
	// get todos from firebase
	firebase.database().ref('todos/').once('value').then(function(snapshot) {
		// it returns a snapshot object, that contains list of objects or empty
		if(!snapshot.val() || snapshot.val().length==0){
			// if it's empty show the Empty message in the container, it wil replace the loading message
			loadingHtml = '\
			  <div class="list-group-item active">\
				Empty\
			  </div>\
			';
			container.innerHTML = loadingHtml; 
		}
		else {
			// otherwise loop the array
			for (var key in snapshot.val()){
				// update the completed value for the key
				firebase.database().ref('todos/' + key).update({
					completed: completed
				});
			}
		}
		// once updated all refresh the list on the page
		renderAll();
	});
}
