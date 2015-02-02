/**
 * Jan 21, 2015
 * script.js 
 * @author mzereba
 */

var module = angular.module('Contacts', ["ui.bootstrap.modal"]);

module.service('ContactService', function ($http) {
    //to create unique contact id
    var uid = 1;
    
    var user = ''; // https://mzereba.rww.io/profile/card#me
    var storage = 'http://mzereba.rww.io/storage/contacts/';
    //var storage = 'http://essam.crosscloud.qcri.org/storage/contacts/';
     
    //contacts array to hold list of all contacts
    var contactsOld = [
        {id: 0, 'name': 'Maged Zereba', 'email': 'mzereba@qf.org.qa', 'phone': '111'},
        {id: 1, 'name': 'Essam Mansour', 'email': 'emansour@qf.org.qa', 'phone': '222'}
        ];
    
    var contacts = [];
       
    this.save = function (contact) {
        if (contact.id == null) {
            //if this is new contact, add it in contacts array
            uid++;
            contact.id = uid; // contact.id = contacts.length;
            insertContact(contact);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in contacts) {
                if (contacts[i].id == contact.id) {
                	insertContact(contact);
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
    
    this.load = function () {
        //getContactsList();
    	var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    
	    f.nowOrWhenFetched(storage + '*',undefined,function(){

	    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
		var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		//var myOntology = $rdf.Namespace('http://user.pds.org/ontology/'); 
		var myOntology = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');
		var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');

		var evs = g.statementsMatching(undefined, RDF('type'), myOntology('Individual'));
		if (evs != undefined) {
		    for (var e in evs) {
			var id = evs[e]['subject']['value'];
			var fullname = g.anyStatementMatching(evs[e]['subject'], DC('fn'));
			var email = g.anyStatementMatching(evs[e]['subject'], DC('hasEmail'));
			var phone = g.anyStatementMatching(evs[e]['subject'], DC('hasTelephone'));
			var fullname2 = g.anyStatementMatching(evs[e]['subject'], myOntology('fn'));

//			var contact = {
//			    id: ,
//			    fullname: ,
//			    email: ,
//			    phone: 
//			};
//			contacts.push(contact);
		    }
		}

	    });
        	
    }

    // Function to insert or update a resource
    function insertContact(contact){
    //  var d = new Date();
    //  var timestamp = d.getTime();
    	var uri = storage + "vcard_" + contact.id;
        var resource = buildRDFResource(contact, uri);
        $http({
          method: 'PUT', 
          url: uri,
          data: resource,
          headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            console.log('Success: Resource created.');
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            console.log('Forbidden: Authentication required to create new resource.');
          } else if (status == 403) {
            console.log('Forbidden: You are not allowed to create new resource.');
          } else {
            console.log('Failed '+ status + data);
          }
        });
        
        // Listing
        getContactsList();
    }
    
    // Function to list resources
    function getContactsList(){
    //  var d = new Date();
    //  var timestamp = d.getTime();
    	var uri = storage + "*";
        $http({
            method: 'GET', 
            url: uri,
            data: '',
            headers: {
              'Accept': 'text/turtle',
            },
            withCredentials: true
          }).
          success(function(data, status, headers) {
            if (status == 200 || status == 201) {
            	//contacts = data;
            	console.log('Success', 'Resource retrieved.');
            }
          }).
          error(function(data, status) {
            if (status == 401) {
            	console.log('Forbidden', 'Authentication required to edit the resource.');
            } else if (status == 403) {
            	console.log('Forbidden', 'You are not allowed to edit the resource.');
            } else {
            	console.log('Failed '+status, data);
            }
         }); 
    }

    function buildRDFResource(contact, uri){
        var rdf =   "<" + uri + ">\n" +
                "a <http://www.w3.org/2000/01/rdf-schema#Resource>, <http://www.w3.org/2006/vcard/ns#Individual> ;\n" +
                "<http://www.w3.org/2006/vcard/ns#fn> \"" + contact.name + "\" ;\n" +
                "<http://www.w3.org/2006/vcard/ns#hasEmail> <mailto:" + contact.email + "> ;\n" + 
                "<http://www.w3.org/2006/vcard/ns#hasTelephone> <tel:" + contact.phone + "> .\n";
        return rdf;
    }
});

module.controller('ContactController', function ($scope, $http, $sce, ContactService) {
    $scope.contacts = ContactService.list();
    $scope.modalTitle = '';
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);

    $scope.del = function (id) {
        ContactService.del(id);
        if ($scope.newcontact.id == id) $scope.newcontact = {};
    }
    
    $scope.load = function () {
        ContactService.load();
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
        $scope.load();
        
      },false);
})

