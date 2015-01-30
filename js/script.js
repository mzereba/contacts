/**
 * Jan 21, 2015
 * script.js 
 * @author mzereba
 */

var module = angular.module('Contacts', ["ui.bootstrap.modal"]);

module.service('ContactService', [function ($http) {
    //to create unique contact id
    var uid = 1;
     
    //contacts array to hold list of all contacts
    var contacts = [
        {id: 0, 'name': 'Maged Zereba', 'email': 'mzereba@qf.org.qa', 'phone': '111'},
        {id: 1, 'name': 'Essam Mansour', 'email': 'emansour@qf.org.qa', 'phone': '222'}
        ];
     
    //save method create a new contact if not already exists
    //else update the existing object
    this.saveOld = function (contact) {
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
    
    this.save = function (contact) {
        if (contact.id == null) {
            //if this is new contact, add it in contacts array
            contact.id = uid++;
            putVCard(contact);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in contacts) {
                if (contacts[i].id == contact.id) {
                	putVCard(contact);
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

    var user = '';
    var storage = 'http://mzereba.rww.io/storage/contacts/';
    //var storage = 'http://essam.crosscloud.qcri.org/storage/contacts/';
    var prefix = "vcard_";

    function putVCard(contact){
    //  var d = new Date();
    //  var timestamp = d.getTime();
    	var uri = storage + prefix + contact.id;
        var card = createVCard(contact, uri);
        $http({
          method: 'PUT', 
          url: uri,
          data: card,
          headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            // Add resource to the list
            notify('Success', 'Resource created.');
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
            notify('Forbidden', 'You are not allowed to create new resource.');
          } else {
            notify('Failed '+ status, data);
          }
        }); 
    }

    function createVCard(contact, uri){
        var rdf = "";
        rdf =   "<" + uri + ">" +
                "a <http://www.w3.org/2006/vcard/ns#Individual> ;" +
                "<http://www.w3.org/2006/vcard/ns#fn> '" + contact.name + "';" +
                "<http://www.w3.org/2006/vcard/ns#hasEmail> <mailto:" + contact.email + ">;" + 
                "<http://www.w3.org/2006/vcard/ns#hasTelephone> <tel:" + contact.phone + ">.";
        return rdf;
    }
}]);

module.controller('ContactController', function ($scope, $http, $sce, ContactService) {
	
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
    
    $scope.save = function(newcontact) {
    	//ContactService.save($scope.newcontact);
    	ContactService.save(newcontact);
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
          $scope.authenticate(e.data.slice(5, e.data.length));
          user = e.data.slice(5);
        }
        $scope.closeAuth();
        
        //Fetch user data after login
        
      },false);
})

