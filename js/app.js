/**
 * Jan 21, 2015
 * script.js 
 * @author mzereba
 */

var app = angular.module('Contacts', ['ui.bootstrap.modal', 'ui.bootstrap.dropdown', 'ui.bootstrap.tooltip']);

app.directive('ngFocus', function($timeout) {
    return {
        link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus(); } );
                }
            }, true);

            element.bind('blur', function () {
                if ( angular.isDefined( attrs.ngFocusLost ) ) {
                    scope.$apply( attrs.ngFocusLost );

                }
            });
        }
    };
});

app.controller('ContactController', function ($scope, $http, $sce) {
	$scope.contacts = [];
	$scope.searchedContacts = [];
	$scope.workspaces = [];
    $scope.modalTitle = '';
    $scope.loggedin = false;
    
    $scope.userProfile = {};
    $scope.endpoint = '';	
    $scope.path = '';	
    $scope.prefix = "vcard_";
    $scope.metadata = "app-contacts.metadata";
    $scope.appurl = "http://mzereba.github.io/contacts/";
    $scope.apptypes = "http://www.w3.org/2006/vcard";
    $scope.defaultstorage = "Private/Contacts/";
    var CREATE = 0;
    var UPDATE = 1;
           
    var queryTemplate = "construct { \n" +
						"?VCard a <http://www.w3.org/2000/01/rdf-schema#Resource>, <http://www.w3.org/2006/vcard/ns#Individual> ; \n" +
						"<http://www.w3.org/2006/vcard/ns#fn> ?Name ; \n" +
						"<http://www.w3.org/2006/vcard/ns#hasEmail> ?Email; \n" +
						"<http://www.w3.org/2006/vcard/ns#hasTelephone> ?Tel; \n" +
						"<http://www.w3.org/2006/vcard/ns#hasUID> ?vcWebID; \n" +
						"<http://www.w3.org/2006/vcard/ns#hasPhoto> ?vcPhoto; \n" +
						"<http://www.w3.org/2006/vcard/ns#hasKey> \"Public\" . \n" +
						"} \n" +
						"wherever { \n" +
						"?lVCard a <http://www.w3.org/2006/vcard/ns#Individual> . \n" + 
						"?lVCard <http://www.w3.org/2006/vcard/ns#hasUID> ?oWebID . \n" +
						"?oWebID <http://www.w3.org/ns/pim/space#storage> ?Storage . \n" +
						"?Storage <http://www.w3.org/ns/ldp#contains> ?Contacts . \n" +
						"?Contacts <http://purl.org/dc/terms/title> \"contacts\" . \n" +
						"?Contacts <http://www.w3.org/ns/ldp#contains> ?VCard . \n" +
						"?VCard a <http://www.w3.org/2006/vcard/ns#Individual> . \n" + 
    					"?VCard <http://www.w3.org/2006/vcard/ns#hasKey> \"Public\" . \n" + 
						"?VCard <http://www.w3.org/2006/vcard/ns#fn> ?Name . \n" +
						"?VCard <http://www.w3.org/2006/vcard/ns#hasEmail> ?Email . \n" +
						"?VCard <http://www.w3.org/2006/vcard/ns#hasTelephone> ?Tel . \n" +
						"?VCard <http://www.w3.org/2006/vcard/ns#hasUID> ?vcWebID . \n" +
						"?VCard <http://www.w3.org/2006/vcard/ns#hasPhoto> ?vcPhoto . \n" +
						//"FILTER(!REGEX(str(?lVCard), \"vcard_0\")) \n" +
						//"FILTER(str(?lVCard) != str(?VCard)) \n" + 
						//"filter ( !regex(str(?VCard), \"vcard_0\")  ) \n"
						" \n"; 

    $scope.queryResult = 'null';
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
    
    // Define the appuri, used as key when saving to sessionStorage
    $scope.appuri = window.location.origin;
    
    // Save profile object in sessionStorage after login
    $scope.saveCredentials = function () {
        var app = {};
        var _user = {};
        app.userProfile = $scope.userProfile;
        sessionStorage.setItem($scope.appuri, JSON.stringify(app));
    };

    // Clear sessionStorage on logout
    $scope.clearLocalCredentials = function () {
        sessionStorage.removeItem($scope.appuri);
    };
    
    $scope.logout = function() {
    	$scope.contacts.length = 0;
    	$scope.userProfile = {};
    	$scope.clearLocalCredentials();
    	$scope.loggedin = false;
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
        	$scope.loggedin = true;
            notify('Success', 'Authenticated user.');
        } else {
            notify('Failed', 'Authentication failed.');
        }
    };
    
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
    
    // Simply search contacts list for given contact
    // and replaces the contact object if found
    $scope.replace = function (contact) {
        for (i in $scope.contacts) {
            if ($scope.contacts[i].id == contact.id) {
                $scope.contacts[i] = contact;
            }
        }
    };
     
    $scope.add = function() {
    	$scope.modalTitle = "New Contact";
    	$scope.editContactModal = true;
    	$scope.newcontact = {}
    	$scope.newcontact.visibility = "Private";
    	$scope.isFocused = true;
    };
    
    $scope.search = function() {
    	$scope.modalTitle = "Search Contact";
    	$scope.searchContactModal = true;
    	$scope.searchcontact = {};
    	$scope.isFocused = true;
    };
    
    $scope.addProfile = function() {
    	$scope.modalTitle = "Create vCard";
    	$scope.noteTitle = "Warning: you do not have a vCard, please create one!";
    	$scope.editProfileModal = true;
    	$scope.newcontact = {}
    	$scope.newcontact.webid = $scope.user;
    	$scope.isFocused = true;
    };
    
    $scope.edit = function(id) {
    	$scope.modalTitle = "Edit Contact";
    	$scope.editContactModal = true;
    	$scope.newcontact = angular.copy($scope.get(id));
    	$scope.isFocused = true;
    };
    
    $scope.editProfile = function() {
    	$scope.contact = angular.copy($scope.get(0));
    	if($scope.contact == undefined){
   			$scope.addProfile();
   		}else{
	    	$scope.modalTitle = "Edit Me";
	    	$scope.noteTitle = "";
	    	$scope.editProfileModal = true;
	    	$scope.newcontact = angular.copy($scope.get(0));
	    	$scope.isFocused = true;
   		}
    };
    
    $scope.view = function(id) {
   		$scope.modalTitle = "View Contact";
    	$scope.viewContactModal = true;
    	$scope.viewcontact = angular.copy($scope.get(id));
    };
    
    $scope.viewSearched = function(contact) {
   		$scope.modalTitle = "View Contact";
    	$scope.viewSearchedContactModal = true;
    	$scope.viewsearchedcontact = contact;
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
    
    $scope.myStorage = function() {
    	$scope.modalTitle = "My Storage";
    	$scope.myStorageModal = true;
    	$scope.mystorage = {}
    	$scope.isFocused = true;
    };
    
    $scope.save = function(newcontact) {
    	if (newcontact.id == null) {
            //if this is new contact, add it in contacts array
    		//generate unique id
            newcontact.id = new Date().getTime();
            $scope.insertContact(newcontact, CREATE);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in $scope.contacts) {
                if ($scope.contacts[i].id == newcontact.id) {
                	$scope.insertContact(newcontact, UPDATE);
                }
            }
        }
    	
    	$scope.editContactModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
    
    $scope.query = function(searchcontact) {
    	$scope.searchedContacts = [];
    	if(searchcontact.fullname != ""){
    		var q = queryTemplate + 
		    		"FILTER(REGEX(?Name, " + "\"" + searchcontact.fullname + "\"" + ")) \n" +
					" \n" +
					"} \n";
    		
    		$scope.searchContact(q);
    	}else
    		alert("Please enter a value for the search");
    };
       
    $scope.saveProfile = function(newcontact) {
    	if (newcontact.id == null) {
            //if this is new contact, add it in contacts array
            newcontact.id = 0; // Generate unique id
            $scope.insertContact(newcontact, CREATE);
        } else {
            //for existing contact, find this contact using id
            //and update it.
            for (i in $scope.contacts) {
                if ($scope.contacts[i].id == newcontact.id) {
                	$scope.insertContact(newcontact, UPDATE);
                }
            }
        }
    	
    	$scope.editProfileModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
    
    $scope.createNewStorage = function(mystorage) {
    	
    	var storage = mystorage.workspace + mystorage.storagename + "/";
    	var workspace = mystorage.workspace;
    	var uri = $scope.userProfile.preferencesDir+$scope.metadata;
    	$scope.createMetadata(uri, UPDATE, storage);
    	$scope.mystorage = {};
    };
    
    $scope.import = function(contact, input) {
        //if this is new contact, add it in contacts array
		//generate unique id
    	contact.id = new Date().getTime();
        $scope.insertContact(contact, CREATE);
        
        if(input == 'viewsearchedcontact'){
	        $scope.viewSearchedContactModal = false;
	    	$scope.viewsearchedcontact = {};
        }
    };
    
    $scope.closeEditor = function() {
    	$scope.editContactModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeSearch = function() {
    	$scope.queryResult = 'null';
  	  	$scope.searchedContacts = [];
    	$scope.searchContactModal = false;
    	$scope.isFocused = false;
  	  	$scope.searchcontact = {};
    };
    
    $scope.closeProfileEditor = function() {
    	$scope.editProfileModal = false;
    	$scope.isFocused = false;
    	$scope.newcontact = {};
    };
    
    $scope.closeViewer = function() {
    	$scope.viewContactModal = false;
    	$scope.viewcontact = {};
    };
    
    $scope.closeSearchViewer = function() {
    	$scope.viewSearchedContactModal = false;
    	$scope.viewsearchedcontact = {};
    };
    
    $scope.closeProfileViewer = function() {
    	$scope.viewProfileModal = false;
    	$scope.viewcontact = {};
    };
    
    $scope.closeMyStorage = function() {
    	$scope.myStorageModal = false;
    	$scope.isFocused = false;
    	$scope.mystorage = {};
    };
    
    $scope.openAuth = function() {
    	$scope.authenticationModal = true;	 
    };
    
    $scope.closeAuth = function() {
    	$scope.authenticationModal = false;
    };
    
    $scope.isVisible = function (storage){
    	var split = storage.split("/");
	    var match = "";
    	for(var i=0; i<split.length-2; i++){
    		match += split[i] + "/";
	    }
    	 return $scope.userProfile.visibleWorkspaces.indexOf(match);
    }
           
    // Listing contact resources
    $scope.load = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    $scope.contacts.length = 0;
	    
	    for (var i in $scope.userProfile.contactStorages) {
	    	if($scope.isVisible($scope.userProfile.contactStorages[i]) != -1) {
			    f.nowOrWhenFetched($scope.userProfile.contactStorages[i] + '*',undefined,function(){	
				    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
					var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
					var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
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
							
							var uid = g.anyStatementMatching(evs[e]['subject'], VCARD('hasUID'))['object']['value'];
							
							var pic = g.anyStatementMatching(evs[e]['subject'], VCARD('hasPhoto'))['object']['value'];
							
							var key = g.anyStatementMatching(evs[e]['subject'], VCARD('hasKey'))['object']['value'];
							
							var contact = {
							    id: sId[1],
							    fullname: fullname,
							    email: sEmail[1],
							    phone: sPhone[1],
								webid: uid,
								photo: pic,
								visibility: key
							};
							$scope.contacts.push(contact);
		                    $scope.$apply();
		                }
						$scope.contacts.sort(function(a, b){
							 return a.id-b.id
						})
					}
			    });
	    	}
	    }
    };
    
    //Listing contact resources from response
    $scope.loadSearched = function (data){
    	var g = $rdf.graph();
  	  	var p = $rdf.N3Parser(g, g, "http://crosscloud.qcri.org/LDM/server/RDF/query", "http://crosscloud.qcri.org/LDM/server/RDF/query", null, null, "", null);
  	  	p.loadBuf(data);
  	  	
  	  	var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
		var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
		var VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');

		var evs = g.statementsMatching(undefined, RDF('type'), VCARD('Individual'));
		if (evs != undefined) {
			for (var e in evs) {
				var vcard_uri = evs[e]['subject']['value'];
				var sId = vcard_uri.split("_"); 
				
				var fullname = g.anyStatementMatching(evs[e]['subject'], VCARD('fn'))['object']['value'];
				
				var email = g.anyStatementMatching(evs[e]['subject'], VCARD('hasEmail'))['object']['value'];
				var sEmail = email.split(":");
				
				var phone = g.anyStatementMatching(evs[e]['subject'], VCARD('hasTelephone'))['object']['value'];
				var sPhone = phone.split(":");
				
				var uid = g.anyStatementMatching(evs[e]['subject'], VCARD('hasUID'))['object']['value'];
				
				var pic = g.anyStatementMatching(evs[e]['subject'], VCARD('hasPhoto'))['object']['value'];
				
				var key = g.anyStatementMatching(evs[e]['subject'], VCARD('hasKey'))['object']['value'];
								
				var contact = {
				    id: sId[1],
				    fullname: fullname,
				    email: sEmail[1],
				    phone: sPhone[1],
					webid: uid,
					photo: pic,
					visibility: key,
					source: vcard_uri
				};
				$scope.searchedContacts.push(contact);
                //$scope.$apply();
            }
		}
    };
    
    // Gets workspaces
    $scope.getWorkspaces = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    var uri = $scope.userProfile.preferencesFile;
	    
	    f.nowOrWhenFetched(uri + '*',undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var TYPE = $rdf.Namespace('https://example.com/');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
	
			var evs = g.statementsMatching(undefined, RDF('type'), TYPE('prefs'));
			if (evs != undefined) {
				for (var e in evs) {
					var ws = g.statementsMatching(evs[e]['subject'], SPACE('workspace'));
					
					for (var s in ws) {
						var workspace = ws[s]['object']['value'];
						$scope.workspaces.push(workspace);
					}
										
                    $scope.$apply();
                }
			}
			
			$scope.isMetadataExisting();
	    });
    };
    
    // Getting user storage
    $scope.getStorage = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    //var uri = $scope.user.slice(0,$scope.user.length-3);
	    var uri = ($scope.userProfile.webid.indexOf('#') >= 0)?$scope.userProfile.webid.slice(0, $scope.userProfile.webid.indexOf('#')):$scope.userProfile.webid;
	    
	    f.nowOrWhenFetched(uri ,undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
			var FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
	
			var evs = g.statementsMatching(undefined, RDF('type'), FOAF('Person'));
			if (evs != undefined) {
				for (var e in evs) {
					var storage = g.anyStatementMatching(evs[e]['subject'], SPACE('storage'))['object']['value'];
					var prfs = g.anyStatementMatching(evs[e]['subject'], SPACE('preferencesFile'))['object']['value'];
					var fullname = g.anyStatementMatching(evs[e]['subject'], FOAF('name'))['object']['value'];
					var image = g.anyStatementMatching(evs[e]['subject'], FOAF('img'))['object']['value'];
					
					$scope.userProfile.storage = storage;
					$scope.userProfile.preferencesFile = prfs;
					
					var split = $scope.userProfile.preferencesFile.split("/");
				    var prfsDir = "";
				    for(var i=0; i<split.length-1; i++){
				    	prfsDir += split[i] + "/";
				    }
				    
				    $scope.userProfile.preferencesDir = prfsDir;
				    $scope.userProfile.fullname = fullname;
					$scope.userProfile.image = image;
				    
					$scope.saveCredentials();
                    $scope.$apply();
                }
			}
			
            $scope.getEndPoint($scope.userProfile.storage);
            $scope.getWorkspaces();
            //$scope.isMetadataExisting();
	    });  
    };
    
    // Getting contacts storages
    $scope.getContactsStorages = function (uri) {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    
	    f.nowOrWhenFetched(uri + '*',undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var APP = $rdf.Namespace('https://example.com/');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
	
			var evs = g.statementsMatching(undefined, RDF('type'), APP('application'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value'];
					
					var storages_array = g.statementsMatching(evs[e]['subject'], SPACE('storage'));
					var storages = [];
					for (var s in storages_array) {
						storages.push(storages_array[s]['object']['value']);
					}
					
					var workspaces_array = g.statementsMatching(evs[e]['subject'], SPACE('workspace'));
					var workspaces = [];
					for (var w in workspaces_array) {
						workspaces.push(workspaces_array[w]['object']['value']);
					}
					
					$scope.userProfile.contactStorages = storages;
					$scope.userProfile.visibleWorkspaces = workspaces;
					$scope.saveCredentials();
                    $scope.$apply();
                }
			}
			//fetch user contacts
			$scope.load();
	    });
    };
    
    // Getting user endpoint
    $scope.getEndPoint = function (storage) {
		var aDomain = storage.split("/");
    	var uri= "http://" + aDomain[2] + "/.wellknown";
    	$http({
            method: 'GET', 
            url: uri,
            headers: {
          	'Accept': 'text/turtle'
            },
            withCredentials: true
          }).
          success(function(data, status, headers) {
            if (status == 200 || status == 201) {
            	$scope.endpoint = data;
            }
          }).
          error(function(data, status) {
            if (status == 401) {
              notify('Forbidden', 'Authentication required to create new resource.');
            } else if (status == 403) {
              notify('Forbidden', 'You are not allowed to create new resource.');
            } else {
              notify('Failed '+ status + data);
            }
          });
    };
    
    // Check if metadata for contacts app exists, if not create it
    $scope.isMetadataExisting = function () {
    	var uri = $scope.userProfile.preferencesDir;
	    uri += $scope.metadata;
	    
        $http({
          method: 'HEAD',
          url: uri,
          withCredentials: true
        }).
        success(function(data, status, headers) {
          //add dir to storage
          //console.log("Contacts container found");
          //$scope.path = uri;
        	$scope.getContactsStorages(uri);       
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create a directory for: '+$scope.user);
          } else if (status == 403) {
        	  notify('Forbidden', 'You are not allowed to access storage for: '+$scope.user);
          } else if (status == 404) {
        	  //console.log('Contacts container not found...', 'creating it');
        	  //create default contacts container
        	  $scope.createMetadata(uri, CREATE, $scope.defaultstorage);
          } else {
        	  notify('Failed - HTTP '+status, data, 5000);
          }
        });
    };
    
    // Creates contacts metadata
    $scope.createMetadata = function (uri, action, container) {
    	var resource = $scope.metadataTemplate(action, container);
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
            notify('Success', uri + " updated");
            $scope.createContainer(action, container);
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new directory.');
          } else if (status == 403) {
            notify('Forbiddenn', 'You are not allowed to create new directory.');
          } else {
            notify('Failed: '+ status + data);
          }
        });
    };
    
    // Creates container
    $scope.createContainer = function (action, container) {
    	var split = $scope.userProfile.preferencesDir.split("/");
	    var uri = "";
    	if(action == CREATE) {
	    	for(var i=0; i<split.length-2; i++){
	    		uri += split[i] + "/";
		    }
	    	uri += container;
	    } else {
	    	uri = container;
	    }
	    
		$http({
          method: 'PUT', 
	      url: uri,
          data: '',
          headers: {
            'Content-Type': 'text/turtle',
			'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
        	  notify('Success', 'Contacts container has been created under ' + container);
        	  var path = $scope.userProfile.preferencesDir + $scope.metadata;
        	  $scope.getContactsStorages(path);
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new directory.');
          } else if (status == 403) {
            notify('Forbiddenn', 'You are not allowed to create new directory.');
          } else {
            notify('Failed: '+ status + data);
          }
        });
    };
    
    // Insert or update a contact resource
    $scope.insertContact = function (contact, operation) {
	    var uri = contact.workspace + $scope.prefix + contact.id;
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
            if(operation == CREATE){
            	notify('Success', 'Resource created.');
            	//update view
            	$scope.contacts.push(contact);
            }
            else {
            	notify('Success', 'Resource updated.');
    	    	$scope.replace(contact);
          	}
            $scope.newcontact = {};
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
            notify('Forbidden', 'You are not allowed to create new resource.');
          } else {
            notify('Failed '+ status + data);
          }
        });
    };
    
    // Search contacts using link following
    $scope.searchContact = function (q) {
    	var uri = $scope.endpoint;
        $http({
          method: 'POST', 
          url: uri,
          data: q,
          headers: {
        	'Content-Type': 'text/plain',
        	'Accept': 'text/turtle'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
       		  $scope.queryResult = data;
        	  $scope.loadSearched(data);
        	  $scope.searchcontact = {};
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
            notify('Forbidden', 'You are not allowed to create new resource.');
          } else {
            notify('Failed '+ status + data);
          }
        });
    };
        
    // Iterate through contacts list and delete
    // contact if found
    $scope.remove = function (contact) {
        var uri = $scope.path + $scope.prefix + contact.id;
    	$http({
    	      method: 'DELETE',
    	      url: uri,
    	      withCredentials: true
    	    }).
    	    success(function(data, status, headers) {
    	      if (status == 200) {
    	    	notify('Success', 'Resource deleted.');
    	        //update view
    	    	var indexOf = $scope.contacts.indexOf(contact);
    	    	if (indexOf !== -1) {
    	    		$scope.contacts.splice(indexOf, 1);
    	    	}
    	      }
    	    }).
    	    error(function(data, status) {
    	      if (status == 401) {
    	    	  notify('Forbidden', 'Authentication required to delete '+uri);
    	      } else if (status == 403) {
    	    	  notify('Forbidden', 'You are not allowed to delete '+uri);
    	      } else if (status == 409) {
    	    	  notify('Failed', 'Conflict detected. In case of directory, check if not empty.');
    	      } else {
    	    	  console.log('Failed '+status, data);
    	      }
    	});
    	
        if ($scope.newcontact.id == contact.id) $scope.newcontact = {};
    };
             
    // Composes an RDF resource to send to the server
    $scope.composeRDFResource = function (contact, uri) {
       var rdf =   "<" + uri + ">\n" +
          "a <http://www.w3.org/2000/01/rdf-schema#Resource>, <http://www.w3.org/2006/vcard/ns#Individual> ;\n" +
          "<http://www.w3.org/2006/vcard/ns#fn> \"" + contact.fullname + "\" ;\n" +
          "<http://www.w3.org/2006/vcard/ns#hasEmail> <mailto:" + contact.email + "> ;\n" + 
          "<http://www.w3.org/2006/vcard/ns#hasTelephone> <tel:" + contact.phone + "> ;\n" +
          "<http://www.w3.org/2006/vcard/ns#hasUID> <" + contact.webid + "> ;\n" +
          "<http://www.w3.org/2006/vcard/ns#hasPhoto> <" + contact.photo + "> ;\n" +
       "<http://www.w3.org/2006/vcard/ns#hasKey> \"" + contact.visibility + "\" .\n";
       return rdf;
    };
    
    // Composes an RDF template to represent app metadata
    $scope.metadataTemplate = function (action, container) {
    	var dir = $scope.userProfile.preferencesDir;
    	var id = dir + $scope.metadata;
    	
    	var defaultstorage = "<";
    	var defaultworkspace = "<";
    	
    	if(action == CREATE){
    		var split = dir.split("/");
	    	for(var i=0; i<split.length-2; i++){
	    		defaultstorage += split[i] + "/";
	    	}
	    	defaultstorage += "Private/Contacts/>";
		    
		    for(var i=0; i<split.length-2; i++){
	    		defaultworkspace += split[i] + "/";
		    }
		    defaultworkspace += "Private/>";
    	
    	} else {
    		var storage_string = "<" + container + ">, ";
        	for(i in $scope.userProfile.contactStorages) {
        		storage_string += "<" + $scope.userProfile.contactStorages[i] + ">";
        		if(i != $scope.userProfile.contactStorages.length-1)
        			storage_string += ", ";
     		}
        	defaultstorage = storage_string;
        	
        	var workspace_string = "";
        	for(i in $scope.userProfile.visibleWorkspaces) {
        		workspace_string += "<" + $scope.userProfile.visibleWorkspaces[i] + ">";
        		if(i != $scope.userProfile.visibleWorkspaces.length-1)
        			workspace_string += ", ";
     		}
        	defaultworkspace = workspace_string;
    	}
	    
    	var rdf = "<" + id + ">\n" +
          		 "a <http://www.w3.org/2000/01/rdf-schema#Resource>, <https://example.com/application> ;\n" +
          		 "<http://purl.org/dc/elements/1.1/title> \"Contacts\" ;\n" +
          		 "<https://example.com/app-url> <" + $scope.appurl + "> ;\n" + 
          		 "<https://example.com/logo> <" + $scope.appurl + "images/contacts.gif" + "> ;\n" +
          		 "<https://example.com/types> <" + $scope.apptypes + "> ;\n" +
          		 "<http://www.w3.org/ns/pim/space#storage> " + defaultstorage + " ;\n" +
    			 "<http://www.w3.org/ns/pim/space#workspace> " + defaultworkspace + " .";
       
       return rdf;
    };
       
    // Listen to WebIDAuth events
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventListener = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventListener(messageEvent,function(e) {
        if (e.data.slice(0,5) == 'User:') {          
            $scope.authenticate(e.data.slice(5, e.data.length));
            $scope.userProfile.webid = e.data.slice(5);
            //get user storage and assign contacts dir
            $scope.getStorage();
        }
        
        $scope.closeAuth();
    },false);
    
    // Retrieve from sessionStorage
    if (sessionStorage.getItem($scope.appuri)) {
        var app = JSON.parse(sessionStorage.getItem($scope.appuri));
        if (app.userProfile) {
          //if (!$scope.userProfile) {
          //  $scope.userProfile = {};
          //}
          $scope.userProfile = app.userProfile;
          $scope.getWorkspaces();
          $scope.getContactsStorages($scope.userProfile.preferencesDir + $scope.metadata);
          $scope.loggedin = true;
        } else {
          // clear sessionStorage in case there was a change to the data structure
          sessionStorage.removeItem($scope.appuri);
        }
    }
    
});

