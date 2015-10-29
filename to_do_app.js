//Define your collections
Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  // This code only runs on the client
  //Suscribirse a las tareas que son mías
  var sessionCustomersHandler = false;
  var newSessionCustomersHandler = Meteor.subscribe("tasks", Meteor.userId());
  if (sessionCustomersHandler)
    sessionCustomersHandler.stop();
  sessionCustomersHandler = newSessionCustomersHandler;

  Template.body.helpers({
    tasks: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
    }

  });
  Template.hide_completed.events({
    "click .hide-completed": function (event) {
      Session.set("hideCompleted", event.target.checked);
    },
    hideCompleted: function () {
     return Session.get("hideCompleted");
    }
  });
  Template.add_task.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
      // Get value from form element
      var text = event.target.text.value;
      var description = event.target.description.value;
      // Insert a task into the collection
      Meteor.call("addTask",text, description)
      // Clear form
      event.target.text.value = "";
      event.target.description.value = "";
    }
  });
  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function(event){
      Meteor.call("deleteTask", this._id);
    }
  });

  Accounts.ui.config({
   passwordSignupFields: "USERNAME_ONLY"
 });
}

Meteor.methods({
  addTask: function(text, description){
    Meteor.call("authenticate");
    Tasks.insert({
      text: text,
      description: description,
      createdAt: new Date(), // current time
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function(taskId){
    Meteor.call("authenticate");
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Meteor.call("authenticate");
    Tasks.update(taskId, { $set: { checked: setChecked} });
  },
  authenticate: function(){
    if(! Meteor.userId()){
      throw new Meteor.Error("not-authorized");
    }
  }
});

if (Meteor.isServer) {
  Meteor.publish("tasks", function(userId){
    return Tasks.find({owner: userId});
  });
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
