/**
 *
 *	ISP-not-ISP Checker
 *		by Luke Roberts
 *
 *	Usage:
 *	 node main.js <country code> <row> <debug level> <max rows>
 *
 */

const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');
const dataManip = require('./lib/dataManip');
const Table = require('easy-table');
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
const IPsThreshold = 0.10;
const similarityThreshold = 0.69;

/* colour codes */
const colours = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	black: '\x1b[30m',
	whiteBG: '\x1b[47m'
}

var labels = {};
var typesAttempt = {};
var companyRegEx = /\(c[0-9]{6,}\)/;
var loopCounter = 0;

var usageHelpStr = '\n' + colours.whiteBG + colours.black + '-- Usage:';
usageHelpStr += '\n  node main.js <country code> <row> <debug level> <max rows>';
usageHelpStr += '\nRow, debug level, max rows are all optional, to skip an option simply use `false` or `0`';


var inCountry = process.argv[2];
var oneRowOnly = process.argv[3];
var DEBUG = process.argv[4];
var max = process.argv[5];

if (oneRowOnly == 'false' || oneRowOnly == '0') {
	oneRowOnly = false;
}

/* goodLabels is the list of labels we believe to contain companies, not ISPs/others */
var goodLabels = [];

/* for checking against real types file */
var discrepancies = [];
var added = 0;
var removed = 0;

if (inCountry === undefined) {
	console.log(colours.red + 'No input country set.', usageHelpStr);
	process.exit();
}

try {
	var realTypesFileName = cwdPath + '/real/' + inCountry + '-real.csv';
	var realTypesBuffer = fs.readFileSync(realTypesFileName);
	var realTypesFileData = realTypesBuffer.toString().split('\n');
	var realTypes = [];
} catch (e) {
	console.log('- Warning: No real types file found (' + realTypesFileName + ')');
}

var dataBuffer = fs.readFileSync(cwdPath + '/data/' + inCountry + '.csv');
var dataFileData = csvParse(dataBuffer.toString(), { columns: true });

/* create a str to add each company to to write to the output CSV */
var companiesCSVStr = '';
var outPath = cwdPath + '/out/' + inCountry + '-result.csv';

if (DEBUG === undefined) {
	if (oneRowOnly) {
		DEBUG = true;
	} else {
		DEBUG = false;
	}
} else if (DEBUG === 'false' || DEBUG === '0') {
	DEBUG = false;
}

if (max === undefined) {
	//max = Infinity;
	max = 150;
}

console.log('\n\n-- Starting check with options:');
console.log('  - Debug:', colours.green + DEBUG + colours.reset);
console.log('  - In country:', colours.green + inCountry + colours.reset);
console.log('  - Max:', colours.green + max + colours.reset);
console.log('  - One row:', colours.green + oneRowOnly + colours.reset);
console.log('  - Thresholds: (S:' + similarityThreshold + ', I:' + IPsThreshold + ')');

/* Generate realTypes for later comparison */
for (var f in realTypesFileData) {
	var labelType = realTypesFileData[f].split('\t');

	//if (labelType[0] && labelType[1] && labelType[1] !== 'Mixed') {
	if (labelType[0]) {
		realTypes.push(labelType[0]);
	}
}

console.log('- Data file read.');

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

console.log('- Company list created.');

//console.log('-- Companies:')

for (var l in labels) {
	var total = 0;

	/*
	if (l != 16) continue;
	DEBUG = true;
	*/
	if (oneRowOnly) {
		if (l != oneRowOnly) {
			delete realTypes[realTypes.indexOf(l)];
			continue;
		}
	}

	if (l > max) {
		break;
	}

	var labelsSimilarity = similarity(labels[l]);
	var ratioValuesIPs = ratioUnwanted(labels[l], DEBUG);

	var averageGuess = Math.round((100 * (labelsSimilarity + ratioValuesIPs) / 2)) / 100;
	var similarityBelowThreshold = labelsSimilarity <= similarityThreshold;
	var IPsBelowThreshold = ratioValuesIPs <= IPsThreshold;
	var belowThreshold = similarityBelowThreshold && IPsBelowThreshold;

	if (DEBUG) {
		console.log(IPsBelowThreshold, belowThreshold)
		console.log('\n- DEBUG: Label ' + l + ' scored (S:' + labelsSimilarity + ', I:' + ratioValuesIPs + '), which is ' + (belowThreshold ? 'below' : 'above') + ' the threshold and therefore a' + (belowThreshold ? ' company' : 'n ISP') + '.');
	}

	if (belowThreshold) {
		/* Company */
		goodLabels.push(l);
		//console.log(l);
		//console.log('Label ' + l + ' is a company. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	} else {
		/* ISP */
		//console.log('Label ' + l + ' is an ISP. Certainty: ' + 100 * averageGuess + '%. Example: ' + labels[l][0])
	}
}

for (var c in goodLabels) {
	companiesCSVStr += goodLabels[c] + '\n';
}

fs.writeFile(outPath, companiesCSVStr, function(err) {
    if (err) {
        console.log('- Error saving file:\n', err);
    }

    console.log('- Companies saved to ' + outPath + '.');

	console.log('-- Done' + (DEBUG ? ' (with debug level ' + DEBUG + ')' : '') + '.');
});

if (realTypesFileData && realTypesFileData.length > 0) {

	for (var c in goodLabels) {
		if (realTypes.indexOf(goodLabels[c]) === -1) {
			// a label we thought was a company is not in the check list
			discrepancies.push({type: '+', label: goodLabels[c]});
			added++;
		}
	}

	for (var c in realTypes) {
		if (goodLabels.indexOf(realTypes[c]) === -1) {
			// a label we thought was an ISP is in the check list as a company
			discrepancies.push({type: '-', label: realTypes[c]});
			removed++;
		}
	}

	if (discrepancies.length > 0) {
		console.log('- Discrepancies found:');

		/*
		var discrepanciesSorted = discrepancies.sort(function(a, b) {
			if (a.label > b.label) {
				return true
			}
			return false;
		})

		for (var d in discrepanciesSorted) {
			if (discrepancies[d] && discrepancies[d].label) {
				outStr += (discrepancies[d].type === '+' ? colours.green : colours.red) + discrepancies[d].label + '\t\t';
			}
		}
		*/

		var outTable = new Table;
		var labelsColHeader = colours.reset + 'Labels:' + '\n';

		discrepancies.forEach(function(row) {
			//outTable.cell('Type', (row.type === '+' ? colours.green : colours.red) + row.type);
			outTable.cell(labelsColHeader, (row.type === '+' ? colours.green : colours.red) + row.label + '\t\t');
			outTable.newRow();
		});

		outTable.sort(labelsColHeader);
		console.log(outTable.printTransposed());

		console.log(colours.green + added + colours.reset + ' added, ' + colours.red + removed + colours.reset + ' removed.');
	}
}
