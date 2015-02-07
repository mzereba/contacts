/**
 * Jan 21, 2015
 * script.js 
 * @author mzereba
 */

var module = angular.module('Contacts', ['ui.bootstrap.modal', 'ui.bootstrap.dropdown']);

module.controller('ContactController', function ($scope, $http, $sce) {
	$scope.contacts = [];
    $scope.modalTitle = '';
    
    $scope.user = '';	// 'https://mzereba.rww.io/profile/card#me'
    $scope.path = '';	// 'http://mzereba.rww.io/storage/contacts/';
    //$scope.path = 'http://essam.crosscloud.qcri.org/storage/contacts/';
    $scope.prefix = "vcard_";
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
    
    $scope.status = {
    	    isopen: false
	};

	$scope.toggled = function(open) {
		$log.log('Dropdown is now: ', open);
	};

	$scope.toggleDropdown = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.status.isopen = !$scope.status.isopen;
	};
        
    // Simply search contacts list for given id
    // and returns the contact object if found
    $scope.get = function (id) {
        for (i in $scope.contacts) {
            if ($scope.contacts[i].id == id) {
                return $scope.contacts[i];
            }
        }
    };
       
    $scope.login = function() {
    	 $scope.authenticationModal = true;	 
    };
    
    $scope.add = function() {
    	 $scope.modalTitle = "New Contact";
    	 $scope.editContactModal = true;
    };
    
    $scope.addProfile = function() {
    	$scope.modalTitle = "Create Profile";
    	$scope.noteTitle = "Warning: you currently do not have a profile, please create one!";
    	$scope.editProfileModal = true;
    };
    
    $scope.edit = function(id) {
    	$scope.modalTitle = "Edit Contact";
    	$scope.editContactModal = true;
    	$scope.newcontact = angular.copy($scope.get(id));
    };
    
    $scope.editProfile = function() {
    	$scope.contact = angular.copy($scope.get(0));
    	if($scope.contact == undefined){
   			$scope.addProfile();
   		}else{
	    	$scope.modalTitle = "Edit Profile";
	    	$scope.editProfileModal = true;
	    	$scope.newcontact = angular.copy($scope.get(0));
   		}
    };
    
    $scope.view = function(id) {
   		$scope.modalTitle = "View Contact";
    	$scope.viewContactModal = true;
    	$scope.viewcontact = angular.copy($scope.get(id));
    };
    
    $scope.viewProfile = function() {
    	$scope.contact = angular.copy($scope.get(0));
    	if($scope.contact == undefined){
   			$scope.addProfile();
   		}else{
	    	$scope.modalTitle = "Me";
	    	$scope.viewProfileModal = true;
	    	$scope.viewcontact = angular.copy($scope.get(0));
   		}
    };
    
    $scope.save = function(newcontact) {
    	if (newcontact.id == null) {
            //if this is new contact, add it in contacts array
            newcontact.id = new Date().getTime(); // Generate unique id
            $scope.insertContact(newcontact);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in $scope.contacts) {
                if ($scope.contacts[i].id == newcontact.id) {
                	$scope.insertContact(newcontact);
                }
            }
        }
    	
    	$scope.editContactModal = false;
    	$scope.newcontact = {};
    };
        
    $scope.saveProfile = function(newcontact) {
    	if (newcontact.id == null) {
            //if this is new contact, add it in contacts array
            newcontact.id = 0; // Generate unique id
            $scope.insertContact(newcontact);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in $scope.contacts) {
                if ($scope.contacts[i].id == newcontact.id) {
                	$scope.insertContact(newcontact);
                }
            }
        }
    	
    	$scope.editProfileModal = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeEditor = function() {
    	$scope.editContactModal = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeProfileEditor = function() {
    	$scope.editProfileModal = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeViewer = function() {
    	$scope.viewContactModal = false;
    	$scope.viewcontact = {};
    };
    $scope.closeProfileViewer = function() {
    	$scope.viewProfileModal = false;
    	$scope.viewcontact = {};
    };
    
    $scope.closeAuth = function() {
    	$scope.authenticationModal = false;
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
            console.log("Authenticated user: "+webid);
        } else {
            console.log("Authentication failed: "+webid);
        }
    };
        
    // Listing contact resources
    $scope.load = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    
	    f.nowOrWhenFetched($scope.path + '*',undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			//var myOntology = $rdf.Namespace('http://user.pds.org/ontology/'); 
			var VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');
	
			var evs = g.statementsMatching(undefined, RDF('type'), VCARD('Individual'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value'];
					var sId = id.split("_"); 
					
					var fullname = g.anyStatementMatching(evs[e]['subject'], VCARD('fn'))['object']['value'];
					
					var email = g.anyStatementMatching(evs[e]['subject'], VCARD('hasEmail'))['object']['value'];
					var sEmail = email.split(":");
					
					var phone = g.anyStatementMatching(evs[e]['subject'], VCARD('hasTelephone'))['object']['value'];
					var sPhone = phone.split(":");
					
					var contact = {
					    id: sId[1],
					    fullname: fullname,
					    email: sEmail[1],
					    phone: sPhone[1] 
					};
					$scope.contacts.push(contact);
                    $scope.$apply();
                }
			}
	    });
    };
    
    // Function to insert or update a contact resource
    $scope.insertContact = function (contact) {
	    var contactUri = $scope.path + $scope.prefix + contact.id;
        var resource = $scope.composeRDFResource(contact, contactUri);
        $http({
          method: 'PUT', 
          url: contactUri,
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
            // Update view
            $scope.contacts.length = 0;
            $scope.load();
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
    };
    
    // Iterate through contacts list and delete
    // contact if found
    $scope.remove = function (id) {
        contactUri = $scope.path + $scope.prefix + id;
    	$http({
    	      method: 'DELETE',
    	      url: contactUri,
    	      withCredentials: true
    	    }).
    	    success(function(data, status, headers) {
    	      if (status == 200) {
    	    	console.log('Success', 'Deleted '+contactUri);
    	        // Update view
                $scope.contacts.length = 0;
                $scope.load();
    	      }
    	    }).
    	    error(function(data, status) {
    	      if (status == 401) {
    	    	  console.log('Forbidden', 'Authentication required to delete '+resourceUri);
    	      } else if (status == 403) {
    	    	  console.log('Forbidden', 'You are not allowed to delete '+resourceUri);
    	      } else if (status == 409) {
    	    	  console.log('Failed', 'Conflict detected. In case of directory, check if not empty.');
    	      } else {
    	    	  console.log('Failed '+status, data);
    	      }
    	});
    	
        if ($scope.newcontact.id == id) $scope.newcontact = {};
    };
    
    // Composes an RDF resource to send to the server
    $scope.composeRDFResource = function (contact, uri) {
        var rdf =   "<" + uri + ">\n" +
                "a <http://www.w3.org/2000/01/rdf-schema#Resource>, <http://www.w3.org/2006/vcard/ns#Individual> ;\n" +
                "<http://www.w3.org/2006/vcard/ns#fn> \"" + contact.fullname + "\" ;\n" +
                "<http://www.w3.org/2006/vcard/ns#hasEmail> <mailto:" + contact.email + "> ;\n" + 
                "<http://www.w3.org/2006/vcard/ns#hasTelephone> <tel:" + contact.phone + "> .\n";
        return rdf;
    };
       
    // Listen to WebIDAuth events
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventListener = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventListener(messageEvent,function(e) {
        if (e.data.slice(0,5) == 'User:') {          
            $scope.authenticate(e.data.slice(5, e.data.length));
            $scope.user = e.data.slice(5);
            $scope.path = $scope.user.slice(0, $scope.user.length-15) + 'storage/contacts/';
            
            //Fetch user data after login
            $scope.load();
        }
        
        $scope.closeAuth();
    },false);
});

