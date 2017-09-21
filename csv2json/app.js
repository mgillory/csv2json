// file system module
var fs = require('fs');

const INPUT = 'input.csv';
const OUTPUT = 'output.json';

const FIRSTLEVELTAGS = [
    "fullname",     // string
    "eid",          // *id
    "classes",      // array
    "addresses",    // array
    "invisible",    // boolean
    "see_all"       // boolean
];

const SECONDLEVELTAGS = [
    "type",
    "tags",
    "address"
];

var headers, lines;
var result = [];
var jsonSkull ={};
var ids = [];

// read & write scope
fs.readFile(INPUT, 'utf8', function(error, data) {
    if(error) {
        console.log(error);
        process.exit(1);
    }
    csv2json(data);
    for(var i = 0; i < ids.length; i++)
        result.push(jsonSkull[ids[i]]);
    result = JSON.stringify(result, null, 2);

    fs.writeFile(OUTPUT, result, function(error) {
        if(error) {
            console.log(error);
            process.exit(1);
        }
        console.log(OUTPUT + " created!");
    });
});

function csv2json(csv) {

   lines = csv.split("\n");
   headers = lines[0].match(/("[^"]+"|'[^']+'|[^,]+)/g);

   // initial headers extraction, allowing double and single quotes when field contains commas
   for(var i = 0; i < headers.length; i++) {
       if(headers[i].charAt(0) === '"' && headers[i].charAt(headers[i].length-1) === '"' ||
           headers[i].charAt(0) === "'" && headers[i].charAt(headers[i].length-1) === "'") {
           headers[i] = headers[i].substring(1, headers[i].length-1);
       }
   }

   // initial line parsing
   for(i = 1; i < lines.length; i++) {

      var regex = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
      var current = lines[i].match(regex);

      for(var j = 0; j < current.length; j++) {
          if((current[j].charAt(0) === '"' && (current[j].charAt(current[j].length-1) ===',' &&
                  current[j].charAt(current[j].length-2) === '"')) ||
                  (current[j].charAt(0) === "'" && (current[j].charAt(current[j].length-1) ===','
                      && current[j].charAt(current[j].length-2) === "'")))
              current[j] = current[j].substring(1, current[j].length-2);
          else if(current[j].charAt(0) === ',')
              current[j] = "";
          else if(current[j].charAt(current[j].length-1) === ',')
              current[j] = current[j].substring(0, current[j].length-1);

          current[j] = validateField(current[j], j);
      }
      // line data < mandatory headers
      if(j < headers.length) {
          while(j < headers.length) {
              current[j] = '';
              current[j] = validateField(current[j], j);
              j++;
          }
      }
      json(current, headers.indexOf("eid"));
   }
}

// CSV parsing
function validateField(curr, index) {

    switch(headers[index].split(" ")[0]) {
        case 'email':
            var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var divide = curr.split("/");
            curr = "";

            // logic to validate multiple emails, with / as delimiter
            for(var i = 0; i < divide.length; i++) {
                divide[i] = regex.test(divide[i].trim()) ? divide[i].trim() : "";
                if(i === 0 && divide[i])
                    curr += divide[i];
                else if(i !== 0 && divide[i])
                    curr += "/" + divide[i];
            }
            break;
        case 'phone':
            // logic to handle brazil numbers
            var regex2 = /^(55|\+55|\(\+55\)|\(55\))?(\((\d{2})\)\d{4,5}-?\d{4}|\d{6,7}-?\d{4})$/;
            curr = curr.replace(/\s/g, '');
            if(regex2.test(curr)) {
                curr = curr.replace(/\(|\)|-|\+/g, '');
                // last validations for phone (mobile and not)
                if((curr.length === 10 && curr[2] >= '2' && curr[2] <= '5') ||
                    curr.length === 11 && curr[2] === '9' && curr[3] >= '6' && curr[3] <= '9') {
                    curr = '55' + curr;
                }
                else if(curr.length === 10 && curr[2] >= '6' && curr[2] <= '9') {
                    curr = curr.replace(curr[0] + curr[1], curr[0] + curr[1] + '9');
                    curr = '55' + curr;
                }
                else
                    curr = '';

            } else {
                curr = '';
            }
            break;
        case 'eid':
            // checking for a valid number as id
            curr = isNaN(curr) ? "" : curr;
            break;
        case 'class':
            // replacing possible delimiters with comma
            curr = curr.replace(/[/\\|;]/g, ',');
            break;
        case 'invisible':
            // boolean if
            curr = (curr === '1');
            break;
        case 'see_all':
            // boolean if
            curr = (curr === 'yes');
            break;
    }
    return curr;
}

// JSON creation
function json(curr, idIndex) {
    if(jsonSkull[curr[idIndex]] === undefined) {
        jsonSkull[curr[idIndex]] = {};
        ids.push(curr[idIndex]);
    }
    for(var i = 0; i < headers.length; i++) {
        var type = headers[i].split(" ")[0];
        switch(type) {
            case "phone":
            case "email":
                if(jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[3]] === undefined) {
                    jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[3]] = [];
                }
                if(curr[i] !== '') {
                    var divide = curr[i].split("/");
                    var obj = {};
                    var tagArray = headers[i].replace(type, '').split(",").filter(function(entry) { return entry.trim() !== ''; });
                    tagArray = tagArray.map(function(e){return e.trim();});

                    for(var k = 0; k < divide.length; k++) {
                        var retval = jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[3]].map(function(a) {return a.address === divide[k];}).indexOf(true);
                        // same address value
                        if(retval !== -1) {
                            obj = jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[3]].splice(retval, 1);
                            tagArray.forEach(function(value) {
                                obj[0].tags.push(value);
                            });
                            jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[3]].push(obj[0]);
                        }
                        else {
                            obj[SECONDLEVELTAGS[0]] = type;
                            obj[SECONDLEVELTAGS[1]] = tagArray;
                            obj[SECONDLEVELTAGS[2]] = divide[k];
                            jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[3]].push(obj);
                        }
                        obj = {};
                    }
                }
                break;
            case "class":
                var classes = curr[i].replace(/, | ,/, ",").split(",").filter(function(entry) { return entry.trim() !== ''; });
                if(jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[2]] === undefined) {
                    jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[2]] = [];
                }
                for(var j = 0; j < classes.length; j++)
                    if(jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[2]].indexOf(classes[j].trim()) === -1)
                        jsonSkull[curr[idIndex]][FIRSTLEVELTAGS[2]].push(classes[j].trim());
                break;
            case "invisible":
            case "see_all":
                if(jsonSkull[curr[idIndex]][type] === undefined)
                    jsonSkull[curr[idIndex]][type] = curr[i];
                else
                    jsonSkull[curr[idIndex]][type] = (curr[i]) ? true : jsonSkull[curr[idIndex]][type];
                break;
            default:
                jsonSkull[curr[idIndex]][type] = curr[i];
                break;
        }
    }
}


