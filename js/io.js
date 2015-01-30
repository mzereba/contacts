/**
 * Jan 29, 2015
 * io.js 
 * @author mzereba
 */

var user = '';
var storage = 'http://mzereba.rww.io/storage/contacts/';
//var storage = 'http://essam.crosscloud.qcri.org/storage/contacts/';
var prefix = "vcard_";

function putVCard(contact){
//	var d = new Date();
//	var timestamp = d.getTime(); 
	var card = createVCard(contact);
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

function createVCard(contact){
	var uri = storage + prefix + contact.id;
	var rdf = "";
	rdf =	"<" + uri + ">" +
			"a <http://www.w3.org/2006/vcard/ns#Individual> ;" +
			"<http://www.w3.org/2006/vcard/ns#fn> '" + contact.name + "';" +
			"<http://www.w3.org/2006/vcard/ns#hasEmail> <mailto:" + contact.email + ">;" + 
			"<http://www.w3.org/2006/vcard/ns#hasTelephone> <tel:" + contact.phone + ">.";
	return rdf;
}