var express = require('express');
var router = express.Router();
var fs = require('fs');
var jsonfile = require('jsonfile');
var session = require('express-session');
var request = require('request');
var SparqlClient = require('sparql-client');
var shell = require('shelljs');
var endpointPortNumber = process.argv.slice(2)[1] || 3030;


//var endpoint = 'http:\//localhost:' + endpointPortNumber.toString() +
//  '/datalunes/sparql';
//var client = new SparqlClient(endpoint);
var escapeHtml = require('escape-html');
const ejs = require('ejs');

//  GET home page.
router.get('/', function(req, res) {
console.log("la primera pagina")
  if (!req.session.isAuthenticated && req.app.locals.authRequired)
    res.render('login', {
      title: 'login'
    });
    else {

   // Take the list of existing datasets on hte Fuseki Server
    var list=shell.exec('curl -X GET fuseki_service_container:3030/$/datasets');

    var json_list=JSON.parse(list);

    var array_datasets= json_list.datasets;
    var dataset_list=[];

    for (var i=0; i< array_datasets.length; i++)
    {
    	console.log(array_datasets[i]["ds.name"]);
    	dataset_list[i]=array_datasets[i]["ds.name"];
    }
console.log("usuario"+res.locals.dataset.name);
  
    res.render('homeInitial', {
      title: 'Home',
      metaData: "",
      statistics: "",
      repoInfo: "",
      datasets: dataset_list,
      homePage: "objectText"
    });
  }
    
});

router.get('/home', function(req, res) {
console.log("la primera pagina HOME");
res.locals.user.name="another name";
if (!req.session.isAuthenticated && req.app.locals.authRequired)
    res.render('login', {
      title: 'login'
    });
  else {
    var acceptHeader = req.headers['accept'];
    // return all turtle code inside fuseki endpoint if content-type is turtle
    if (acceptHeader === 'text/turtle' ||
      acceptHeader === 'text/ntriples' ||
      acceptHeader === 'application/rdf+xml' ||
      acceptHeader === 'application/ld+json') {
      var queryObject = 'CONSTRUCT{?s ?p ?o .}WHERE {?s ?p ?o .}';
      var endpoint = "http:\/\/fuseki_service_container:" + process.argv.slice(2)[1] ||
        3030 + "/datalunes/sparql?query="
      request({
        url: endpoint + queryObject,
        headers: {
          'accept': acceptHeader
        },
      }, function(error, response, body) {
        if (error) {
          console.log('error:', error); // Print the error if one occurred
        } else if (response && body) {
          console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          if (body) {
            res.write("RDF code in " + acceptHeader + ":\n");
            res.write(
              "========================================================\n"
            );
            res.write(body);
            res.end();
          } else {
            res.send("No data is found ");
          }
        }
      })
    } else {
      var metaData = "";
      var statistics = "";
      var query_r = {};
      var qe = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
      PREFIX owl: <http://www.w3.org/2002/07/owl#> \
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
      SELECT \
      (count(?cls) as ?Classes)\
      (count(?rdfProperty) as ?RDF_Property)\
      (count(?objProp) as ?OWL_ObjectProperty) \
      (count(?dtProp) as ?OWL_DatatypeProperty) \
      (count(?annot) as ?OWL_AnnotationProperty)\
      (count(?indiv) as ?Individuals)\
      WHERE {{?objProp a owl:ObjectProperty.} \
      UNION {?dtProp a owl:DatatypeProperty.}\
      UNION {?indiv a owl:NamedIndividual.} \
      UNION {?annot a owl:AnnotationProperty.} \
      UNION {?cls a rdfs:Class. FILTER(!isBlank(?cls))} \
      UNION {?cls a owl:Class. FILTER(!isBlank(?cls))} \
	    UNION {?rdfProperty a rdf:Property.}	  \
	  }";

      var qOnt = "PREFIX owl: <http://www.w3.org/2002/07/owl#> \
      SELECT ?p ?o\
      WHERE {\
      ?s a owl:Ontology.\
      OPTIONAL { ?s ?p ?o.}}";

      // check if fuseki endpoint is running
      var output = shell.exec('fuser -v -n tcp ' + endpointPortNumber.toString(), {
        silent: false
      }).stdout;
      if (output) {
        client.query(qOnt, function(error, data) { // query on dataset.
          if (error) {
            console.log(error);
          }
          var result = data.results.bindings;
          if (result[0] != null) {
            // json values of the query result
            metaData = result;
          }
          client.query(qe, function(error, data) { // query on dataset.
            if (error) {
              console.log(error);
            }
            if (data) {
              // string to hold table content
              statistics = "";
              for (key in data['results']['bindings'][0]) {
                var obj = data['results']['bindings'][0][key][
                  'value'
                ];
                if (key == "RDF_Property")
                  key = "RDF Properties";
                if (key == "OWL_ObjectProperty")
                  key = "OWL ObjectProperties";
                if (key == "OWL_DatatypeProperty")
                  key = "OWL DatatypeProperties";
                if (key == "OWL_AnnotationProperty")
                  key = "OWL AnnotationProperties";

                statistics += '<tr><td class="td_content">' +
                  key +
                  '</td><td class="right aligned">' + obj +
                  '</td></tr>';
              }
            }
            // check if the userConfigurations file is exist
            // for the first time of app running
            var path = "jsonDataFiles/userConfigurations.json";
            console.log("check if the userConfigurations file exists")
            fs.exists(path, function(exists) {
              var data = fs.readFileSync(path);
              if (exists && data.includes('vocabularyName')) {
                jsonfile.readFile(path, function(err, obj) {
                  if (err)
                    console.log(err);
                  if (obj.hasOwnProperty(
                      'vocabularyName')) {
                    // string to hold table content
                    var repoInfo = "";
                    repoInfo += '<tr><td class="td_content"> Instance Name</td><td class="right aligned">' +
                      obj.vocabularyName + '</td></tr>';
                    repoInfo += '<tr><td class="td_content"> Repository Owner </td><td class="right aligned">' +
                      obj.repositoryOwner +
                      '</td></tr>';
                    repoInfo += '<tr><td class="td_content"> Repository Service </td><td class="right aligned">' +
                      obj.repositoryService +
                      '</td></tr>';
                    repoInfo += '<tr><td class="td_content"> Repository Branch </td><td class="right aligned">' +
                      obj.branchName + '</td></tr>';

                    res.render('index', {
                      title: 'Home',
                      metaData: metaData,
                      statistics: statistics,
                      repoInfo: repoInfo,
                      homePage: obj.text
                    });

                  }
                });
              }
            });
          });

        });

      } else {
        // check if the userConfigurations file is exist
        // for the first time of app running
        var path = "jsonDataFiles/userConfigurations.json";
        fs.exists(path, function(exists) {
          var data = fs.readFileSync(path);
          if (exists && data.includes('vocabularyName')) {
            jsonfile.readFile(path, function(err, obj) {
              if (err)
                console.log(err);
              if (obj.hasOwnProperty('text'))
                res.render('index', {
                  title: 'Home',
                  metaData: "",
                  statistics: "",
                  repoInfo: "",
                  homePage: obj.text
                });
            });
          }
        });
      }
    }
  }
});

router.post('/home', function(req, res) {

console.log("la primera pagina HOME POST="+req.body.datasetName);
res.locals.dataset.name=req.body.datasetName;

//To change the name of the ontology in the menu
req.app.locals.projectTitle=req.body.datasetName;

console.log("NUEVA HOME POST="+res.locals.dataset.name);
if (!req.session.isAuthenticated && req.app.locals.authRequired)
    res.render('login', {
      title: 'login'
    });
  else {
	  //Delete the existing the existing data from the repoFolder
	  shell.cd("../").stdout;
	  shell.rm("-r", "repoFolder");
	  //Put the corresponding ontology file in the repoFolder
	  shell.exec("cp -r ./db/"+req.body.datasetName+"/. ./repoFolder");
	  //Generation of the Json files from the selected ontology - takes the ttl file from the repoFolder
	  shell.cd("vocol/helper/tools/JenaJsonFilesGenrator/").stdout;
	  shell.exec('java -jar JenaJsonFilesGenerator.jar').stdout;
	  shell.exec('pwd');
	  //Generation of SingleVoc.json for the visualization
	  //shell.exec('pwd');
	  shell.cd("../ttl2ntConverter/").stdout;
	  shell.exec(
          'java -jar ttl2ntConverter.jar ../../../../repoFolder/*.ttl ../serializations/SingleVoc.nt ', {
            silent: false
          });
	console.log("Terminado el convertir los datos y generado el SingleVoc.nt");
	
	    shell.cd('../owl2vowl/').stdout;
	    shell.exec(
	      'java -jar owl2vowl.jar -file ../serializations/SingleVoc.nt', {
		silent: false
	      }).stdout;
	    shell.mv('SingleVoc.json',
	      '../../../views/webvowl/data/').stdout;

    
    // filePath where we read from
    shell.cd("../../../").stdout;
    var filePath = 'jsonDataFiles/userConfigurations.json';
    // read contents of the file with the filePathgetTree
    var contents = fs.readFileSync(filePath);
    let config = JSON.parse(contents);
    
    //Change the dataset name in the configuration file and in the locals
    config.vocabularyName= req.body.datasetName;
    
    // write back to the file with the filePath
    fs.writeFileSync(filePath, JSON.stringify(config));

    var acceptHeader = req.headers['accept'];
    console.log("accpt Header="+acceptHeader);
    // return all turtle code inside fuseki endpoint if content-type is turtle
    if (acceptHeader === 'text/turtle' ||
      acceptHeader === 'text/ntriples' ||
      acceptHeader === 'application/rdf+xml' ||
      acceptHeader === 'application/ld+json') {
      var queryObject = 'CONSTRUCT{?s ?p ?o .}WHERE {?s ?p ?o .}';
      var endpoint = "http:\/\/fuseki_service_container:" + process.argv.slice(2)[1] ||
        3030 + "/"+req.body.datasetName+"/sparql?query="
      request({
        url: endpoint + queryObject,
        headers: {
          'accept': acceptHeader
        },
      }, function(error, response, body) {
        if (error) {
          console.log('error:', error); // Print the error if one occurred
        } else if (response && body) {
          console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          if (body) {
            res.write("RDF code in " + acceptHeader + ":\n");
            res.write(
              "========================================================\n"
            );
            res.write(body);
            res.end();
          } else {
            res.send("No data is found ");
          }
        }
      })
    } else {
      var metaData = "";
      var statistics = "";
      var query_r = {};
      var qe = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
      PREFIX owl: <http://www.w3.org/2002/07/owl#> \
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
      SELECT \
      (count(?cls) as ?Classes)\
      (count(?rdfProperty) as ?RDF_Property)\
      (count(?objProp) as ?OWL_ObjectProperty) \
      (count(?dtProp) as ?OWL_DatatypeProperty) \
      (count(?annot) as ?OWL_AnnotationProperty)\
      (count(?indiv) as ?Individuals)\
      WHERE {{?objProp a owl:ObjectProperty.} \
      UNION {?dtProp a owl:DatatypeProperty.}\
      UNION {?indiv a owl:NamedIndividual.} \
      UNION {?annot a owl:AnnotationProperty.} \
      UNION {?cls a rdfs:Class. FILTER(!isBlank(?cls))} \
      UNION {?cls a owl:Class. FILTER(!isBlank(?cls))} \
	    UNION {?rdfProperty a rdf:Property.}	  \
	  }";

      var qOnt = "PREFIX owl: <http://www.w3.org/2002/07/owl#> \
      SELECT ?p ?o\
      WHERE {\
      ?s a owl:Ontology.\
      OPTIONAL { ?s ?p ?o.}}";

	var endpoint = 'http:\//fuseki_service_container:' + endpointPortNumber.toString() +
	  '/'+req.body.datasetName+'/sparql';
	  
	var client = new SparqlClient(endpoint);

      // check if fuseki endpoint is running --DONT CHECK ADE DOCKERS -> ASSUME ALWAYS RUNNING
      //var output = shell.exec('fuser -v -n tcp ' + endpointPortNumber.toString(), {
        //silent: false
     // }).stdout;
      var output= true
      if (output) {
        client.query(qOnt, function(error, data) { // query on dataset.
          if (error) {
            console.log(error);
          }
          var result = data.results.bindings;
          if (result[0] != null) {
            // json values of the query result
            metaData = result;
          }
          client.query(qe, function(error, data) { // query on dataset.
            if (error) {
              console.log(error);
            }
            if (data) {
              // string to hold table content
              statistics = "";
              for (key in data['results']['bindings'][0]) {
                var obj = data['results']['bindings'][0][key][
                  'value'
                ];
                if (key == "RDF_Property")
                  key = "RDF Properties";
                if (key == "OWL_ObjectProperty")
                  key = "OWL ObjectProperties";
                if (key == "OWL_DatatypeProperty")
                  key = "OWL DatatypeProperties";
                if (key == "OWL_AnnotationProperty")
                  key = "OWL AnnotationProperties";

                statistics += '<tr><td class="td_content">' +
                  key +
                  '</td><td class="right aligned">' + obj +
                  '</td></tr>';
              }
            }
            // check if the userConfigurations file is exist
            // for the first time of app running
            var path = "jsonDataFiles/userConfigurations.json";
            console.log("check if the userConfigurations file exists")
            fs.exists(path, function(exists) {
              var data = fs.readFileSync(path);
              if (exists && data.includes('vocabularyName')) {
                jsonfile.readFile(path, function(err, obj) {
                  if (err)
                    console.log(err);
                  if (obj.hasOwnProperty(
                      'vocabularyName')) {
                    // string to hold table content
                    var repoInfo = "";
                    repoInfo += '<tr><td class="td_content"> Instance Name</td><td class="right aligned">' +
                      obj.vocabularyName + '</td></tr>';
                    repoInfo += '<tr><td class="td_content"> Repository Owner </td><td class="right aligned">' +
                      obj.repositoryOwner +
                      '</td></tr>';
                    repoInfo += '<tr><td class="td_content"> Repository Service </td><td class="right aligned">' +
                      obj.repositoryService +
                      '</td></tr>';
                    repoInfo += '<tr><td class="td_content"> Repository Branch </td><td class="right aligned">' +
                      obj.branchName + '</td></tr>';

                    res.render('index', {
                      title: 'Home',
                      metaData: metaData,
                      statistics: statistics,
                      repoInfo: repoInfo,
                      homePage: obj.text
                    });

                  }
                });
              }
            });
          });

        });

      } else {
        // check if the userConfigurations file is exist
        // for the first time of app running
        var path = "jsonDataFiles/userConfigurations.json";
        fs.exists(path, function(exists) {
          var data = fs.readFileSync(path);
          if (exists && data.includes('vocabularyName')) {
            jsonfile.readFile(path, function(err, obj) {
              if (err)
                console.log(err);
              if (obj.hasOwnProperty('text'))
                res.render('index', {
                  title: 'Home',
                  metaData: "",
                  statistics: "",
                  repoInfo: "",
                  homePage: obj.text
                });
            });
          }
        });
      }
    }
  }
});
module.exports = router;
