const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');
const dataManip = require('./lib/dataManip');
const similarity = dataManip.similarity;
const ratioUnwanted = dataManip.ratioUnwanted;
const cwdPath = process.cwd();

/**
 *
 * likeliness threshold seems to be pretty accurate at 0.69,
 *	maybe do some more experimenting to perfect it?
 *	for now let's just leave at at 0.67 so we hopefully don't
 *	miss any?
 *
 */
//const companyLikelinessThreshold = 0.69;
const companyLikelinessThreshold = 0.67;

var realTypesBuffer = fs.readFileSync(cwdPath + "/data/types.csv");
var realTypesFileData = realTypesBuffer.toString().split('\n');;
var realTypes = {};

const inCountry = 'fr';

var dataBuffer = fs.readFileSync(cwdPath + '/data/' + inCountry + '.csv');
var dataFileData = csvParse(dataBuffer.toString(), { columns: true });
var labels = {};
var typesAttempt = {};
var companyRegEx = /\(c[0-9]{6,}\)/;
var loopCounter = 0;

var oneRowOnly = process.argv[2];
var DEBUG = process.argv[3];

if (DEBUG === undefined) {
	if (oneRowOnly) {
		DEBUG = true;
	} else {
		DEBUG = false;
	}
}

/* goodCompanies is the list of labels we believe to contain companies, not ISPs/others */
var goodCompanies = [];

/* Generate realTypes for later comparison */
for (var f in realTypesFileData) {
	var labelType = realTypesFileData[f].split('    ');

	if (labelType[0] && labelType[1] && labelType[1] !== 'Mixed') {
		realTypes[labelType[0]] = labelType[1];
	}
}

console.log('Data file read.');

for (var r in dataFileData) {
	var data = dataFileData[r];

	var companyName = data['CompanyName'];
	var label = data['label'];

	if (!label || !companyName) {
		continue;
	}

	if (!labels[label]) {
		labels[label] = [];
	}

	labels[label].push(companyName);
}

console.log('Company list created.');

//console.log('-- Companies:')

for (var l in labels) {
	var total = 0;

	/*
	if (l != 16) continue;
	DEBUG = true;
	*/
	if (oneRowOnly) {
		if (l != oneRowOnly) {
			continue;
		}
	}

	if (l > 150) {
		break;
	}

	var labelsSimilarity = similarity(labels[l]);
	var ratioValuesIPs = ratioUnwanted(labels[l], DEBUG);

	var averageGuess = Math.round(100 - (100 * (labelsSimilarity + ratioValuesIPs) / 2)) / 100;
	var aboveThreshold = averageGuess >= companyLikelinessThreshold;

	if (DEBUG) {
		console.log('\n- DEBUG: Label ' + l + ' scored ' + Math.round(100 * averageGuess) / 100 + ', which is ' + (aboveThreshold ? 'above' : 'below') + ' the threshold and therefore a' + (aboveThreshold ? ' company' : 'n ISP') + '.');
	}

	if (aboveThreshold) {
		/* Company */
		goodCompanies.push(l);
		//console.log(l);
		//console.log('Label ' + l + ' is a company. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	} else {
		/* ISP */
		//console.log('Label ' + l + ' is an ISP. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	}
}

var companiesCSVStr = '';

for (c in goodCompanies) {
	companiesCSVStr += goodCompanies[c] + '\n';
}

var outPath = cwdPath + '/out/' + inCountry + '-result.csv';

fs.writeFile(outPath, companiesCSVStr, function(err) {
    if (err) {
        console.log('Error saving file:\n', err);
    }

    console.log('Companies saved to ' + outPath + '.');

	console.log('-- Done with debug level ' + DEBUG + '.');
});