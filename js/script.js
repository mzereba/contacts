/**
 * Jan 21, 2015
 * script.js 
 * @author mzereba
 */

var module = angular.module('Contacts', ["ui.bootstrap.modal"]);

module.service('ContactService', function () {
    //to create unique contact id
    var uid = 1;
     
    //contacts array to hold list of all contacts
    var contacts = [
        {id: 0, 'name': 'Maged Zereba', 'email': 'mzereba@qf.org.qa', 'phone': '111'},
        {id: 1, 'name': 'Essam Mansour', 'email': 'emansour@qf.org.qa', 'phone': '222'}
        ];
     
    //save method create a new contact if not already exists
    //else update the existing object
    this.save = function (contact) {
        if (contact.id == null) {
            //if this is new contact, add it in contacts array
            contact.id = uid++;
            contacts.push(contact);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in contacts) {
                if (contacts[i].id == contact.id) {
                    contacts[i] = contact;
                }
            }
        }
    }
     
    //simply search contacts list for given id
    //and returns the contact object if found
    this.get = function (id) {
        for (i in contacts) {
            if (contacts[i].id == id) {
                return contacts[i];
            }
        }
    }
     
    //iterate through contacts list and delete
    //contact if found
    this.del = function (id) {
        for (i in contacts) {
            if (contacts[i].id == id) {
                contacts.splice(i, 1);
            }
        }
    }
 
    //simply returns the contacts list
    this.list = function () {
        return contacts;
    }
});

module.controller('ContactController', function ($scope, $sce, ContactService) {
	
    $scope.contacts = ContactService.list();
    $scope.modalTitle = '';
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);

    $scope.del = function (id) {
 
        ContactService.del(id);
        if ($scope.newcontact.id == id) $scope.newcontact = {};
    }
    
    $scope.login = function() {
    	 $scope.authenticationModal = true;	 
    };
    
    /* Functions for modal management */
    
    $scope.add = function() {
    	 $scope.modalTitle = "New Contact";
    	 $scope.editContactModal = true;
    };
    
    $scope.edit = function(id) {
    	$scope.modalTitle = "Edit Contact";
    	$scope.editContactModal = true;
    	$scope.newcontact = angular.copy(ContactService.get(id));
    };
    
    $scope.save = function() {
    	ContactService.save($scope.newcontact);
    	$scope.editContactModal = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeEditor = function() {
    	$scope.editContactModal = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeAuth = function() {
    	$scope.authenticationModal = false;
        // modal won't close unless we force $apply()
        $scope.$apply();
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
            console.log("Authenticated user: "+webid);
        } else {
            console.log("Authentication failed: "+webid);
        }
    }

    // Listen to WebIDAuth events
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventListener = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventListener(messageEvent,function(e) {
        if (e.data.slice(0,5) == 'User:') {          
          // fetch user data after login
          $scope.authenticate(e.data.slice(5, e.data.length));
        }
        $scope.closeAuth();
      },false);
})

