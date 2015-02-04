/**
 * Jan 21, 2015
 * script.js 
 * @author mzereba
 */

var module = angular.module('Contacts', ["ui.bootstrap.modal"]);

module.controller('ContactController', function ($scope, $http, $sce) {
	$scope.contacts = [];
    $scope.modalTitle = '';
    
    $scope.user = '';	// 'https://mzereba.rww.io/profile/card#me'
    $scope.path = '';	//	'http://mzereba.rww.io/storage/contacts/';
    //$scope.path = 'http://essam.crosscloud.qcri.org/storage/contacts/';
    $scope.prefix = "vcard_";
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
    
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
    
    /* Functions for modal management */
    
    $scope.add = function() {
    	 $scope.modalTitle = "New Contact";
    	 $scope.editContactModal = true;
    };
    
    $scope.edit = function(id) {
    	$scope.modalTitle = "Edit Contact";
    	$scope.editContactModal = true;
    	$scope.newcontact = angular.copy($scope.get(id));
    };
    
    $scope.save = function(newcontact) {
    	if (newcontact.id == null) {
            //if this is new contact, add it in contacts array
            newcontact.id = $scope.contacts.length;
            $scope.insertContact(newcontact);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in newcontact) {
                if ($scope.contacts[i].id == newcontact.id) {
                	$scope.insertContact(newcontact);
                }
            }
        }
    	
    	$scope.editContactModal = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeEditor = function() {
    	$scope.editContactModal = false;
    	$scope.newcontact = {};
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
    	        // remove resource from the view
    	        $scope.removeResource(id, contactUri);
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
    
    // Listing contact resources
    $scope.load = function () {
    	//$scope.getContactsList();
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
					var fullname = g.anyStatementMatching(evs[e]['subject'], VCARD('fn'))['object']['value'];
					var email = g.anyStatementMatching(evs[e]['subject'], VCARD('hasEmail'))['object']['value'];
					var phone = g.anyStatementMatching(evs[e]['subject'], VCARD('hasTelephone'))['object']['value'];
		
					var contact = {
					    id: id.slice(id.length-1),
					    fullname: fullname,
					    email: email,
					    phone: phone 
					};
					$scope.contacts.push(contact);
                    $scope.$apply();
                }
			}
	    });
    };
    
    // Function to insert or update a contact resource
    $scope.insertContact = function (contact) {
	    var uri = $scope.path + $scope.prefix + contact.id;
        var resource = $scope.composeRDFResource(contact, uri);
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
        $scope.load();
    };
    
    
//    $scope.getContactsList = function() {
//    	var uri = path + "*";
//        $http({
//            method: 'GET', 
//            url: uri,
//            data: '',
//            headers: {
//              'Accept': 'text/turtle',
//            },
//            withCredentials: true
//          }).
//          success(function(data, status, headers) {
//            if (status == 200 || status == 201) {
//            	//contacts = data;
//            	console.log('Success', 'Resource retrieved.');
//            }
//          }).
//          error(function(data, status) {
//            if (status == 401) {
//            	console.log('Forbidden', 'Authentication required to edit the resource.');
//            } else if (status == 403) {
//            	console.log('Forbidden', 'You are not allowed to edit the resource.');
//            } else {
//            	console.log('Failed '+status, data);
//            }
//         }); 
//    };

    // Composes an RDF resource to send to the server
    $scope.composeRDFResource = function (contact, uri) {
        var rdf =   "<" + uri + ">\n" +
                "a <http://www.w3.org/2000/01/rdf-schema#Resource>, <http://www.w3.org/2006/vcard/ns#Individual> ;\n" +
                "<http://www.w3.org/2006/vcard/ns#fn> \"" + contact.name + "\" ;\n" +
                "<http://www.w3.org/2006/vcard/ns#hasEmail> <mailto:" + contact.email + "> ;\n" + 
                "<http://www.w3.org/2006/vcard/ns#hasTelephone> <tel:" + contact.phone + "> .\n";
        return rdf;
    };
    
    // Removes a contact resource from the list
    $scope.removeContact = function (id, contactUri) {
        if ($scope.contacts) {
          for(var i = $scope.contacts.length - 1; i >= 0; i--){
            if($scope.contacts[i].id == id) {
              $scope.contacts.splice(i,1);
              console.log('Success', 'Deleted '+contactUri);
            }
          }
        }
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
        }
        $scope.closeAuth();
        //Fetch user data after login
        $scope.load();
        
      },false);
});

