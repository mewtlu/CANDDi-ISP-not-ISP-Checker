module.exports.similarity = function(stringSet) {
	const stringSimilarity = require('string-similarity');

	var similarityVal = 0;

	var similarities = [];

	for (var s in stringSet) {
		var str1 = stringSet[s].replace(' ', '');
		var str2 = stringSet[stringSet.length - s - 1].replace(' ', '');

		var similarity = stringSimilarity.compareTwoStrings(str1, str2);
		similarities.push(similarity)
	}

	/* Test val: */
	//similarityVal = stringSet.length / 1000 % 1;
	var similaritiesSum = similarities.reduce(function(a, b) {
		return a + b;
	})
	var similarityVal = similaritiesSum / similarities.length;

	//console.log(similarityVal, similaritiesSum, similarities.length)

	var similarityStr = Math.round(100 * similarityVal) / 100;
	return similarityStr;
}

module.exports.ratioUnwanted = function(stringSet, verbose) {
	var IPRegEx = new RegExp('([0-9]{1,3}(\.| )){3}[0-9]{0,3}');

	/* The 'megaRegEx' matches a commonly occuring style of string such as 'enio 190 64.cnt.nerim.net'. */
	/* Unfortunately, it also does not work. */
	//var megaRegEx = '[a-zA-Z0-9]*[a-zA-Z0-9]{0,3}( | \.)[a-zA-Z0-9]{0,3}( | \.)[a-zA-Z0-9]{0,3}( |\.)[a-zA-Z0-9]{1,}( |\.)[a-zA-Z0-9]{1,}( |\.)[a-zA-Z0-9]{1,}';

	var UnwantedRegEx = new RegExp('(^[a-zA-Z]?[0-9]{1,}$)|([0-9]{4} [0-9]{5} [0-9]{3})|([0-9]{9,})|([a-z][0-9]{3}[a-z]{2}[0-9]{4,5})|(.*\.rain\.fr)|($rue.*)|(.*diwemedia[0-9]{1,2})');
	var matched = 0;

	for (s in stringSet) {
		if (IPRegEx.test(stringSet[s]) || UnwantedRegEx.test(stringSet[s])) {
			if (verbose === true || verbose == 1) {
				console.log('- DEBUG: ' + stringSet[s] + ' is an IP.');
			}
			matched++;
		} else {
			if (verbose === true || verbose == 2) {
				console.log('- DEBUG: ' + stringSet[s] + ' isn\'t an IP.')
			}
		}
	}

	return Math.round(100 * matched / stringSet.length) / 100;
}