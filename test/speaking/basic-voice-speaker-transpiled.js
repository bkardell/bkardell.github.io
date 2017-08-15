'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* Why? see https://bkardell.com/blog/Basic-Voice-Speaker.html */

var BasicVoiceSpeaker = function () {

	/*
 	The constructor takes an optional regexp for determining the voice
 	this at least lets us simplify the process of searching for a decent voice
 	that sort of matches something we might expect
 */

	function BasicVoiceSpeaker() {
		var _this = this;

		var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, BasicVoiceSpeaker);

		var synth = window.speechSynthesis,
		    options = {
			filter: function filter() {},
			pitch: 1,
			rate: 1,
			volume: 1
		};
		Object.assign(options, config);

		BasicVoiceSpeaker.__last = BasicVoiceSpeaker.__last || Promise.resolve();

		if (Array.isArray(config.filter) && config.filter.length > 0) {
			options.filter = function (voices) {
				var voice = undefined;

				var _loop = function _loop(i) {
					var nameTest = config.filter[i].name,
					    langTest = config.filter[i].lang,
					    voice = voices.find(function (v) {
						var nameResult = nameTest ? nameTest.test(v.name) : true,
						    langResult = langTest ? langTest.test(v.lang) : true;

						return nameResult && langResult;
					});

					if (voice) {
						return {
							v: voice
						};
					}
				};

				for (var i = 0; i < config.filter.length; i++) {if (window.CP.shouldStopExecution(1)){break;}
					var _ret = _loop(i);

					if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
				}
window.CP.exitedLoop(1);

			};
		}

		// We only ever need get the list of voices once, so
		// let's just expose a promise for that
		BasicVoiceSpeaker.voicesReady = BasicVoiceSpeaker.voicesReady || new Promise(function (resolve) {
			var voices = synth.getVoices();
			if (voices.length === 0) {
				synth.onvoiceschanged = function () {
					resolve(synth.getVoices());
				};
			} else {
				resolve(voices);
			}
		});

		this.ready = new Promise(function (resolve, reject) {
			return BasicVoiceSpeaker.voicesReady.then(function (voices) {
				resolve();
			});
		});

		// There's also a problem with log utterances and managing this is a
		// serious pita with events to this end, let's create an internal,
		// promise based 'speech transaction'
		this.__sayThis = function (shortText) {
			return _this.ready.then(function () {
				return new Promise(function (resolve, reject) {
					var utterThis = new SpeechSynthesisUtterance(shortText),
					    voices = speechSynthesis.getVoices(),

					//choose voice at the moment of queing, unfortunately
					// we can't currently do better than this
					voice = options.filter(voices) || voices.find(function (v) {
						var docLang = document.documentElement.lang || 'en';
						return docLang == v.lang.split(/-|_/)[0];
					}) || voices[0];

					utterThis.pitch = options.pitch;
					utterThis.rate = options.rate;
					utterThis.volume = options.volume;

					utterThis.voice = voice;
					if (voice.voiceURI) {
						utterThis.voiceURI = voice.voiceURI;
						utterThis.lang = voice.lang;
					}
					console.log('promising ', shortText);
					utterThis.onend = function () {
						console.log('done speaking, resolving..', shortText);
						resolve();
					};
					utterThis.onerror = function () {
						resolve();
					};
					setTimeout(function () {
						window.__utterance = utterThis;
						synth.speak(utterThis);
					}, 0);
				});
			});
		};
	}

	// oy, even queing is buggy... a whole bunch of things
	// get spoken and not resolved if I do Promise.all(queue)

	BasicVoiceSpeaker.prototype.__sayNext = function __sayNext(queue) {
		var _this2 = this;

		return this.__sayThis(queue.shift()).then(function () {
			return queue.length > 0 ? _this2.__sayNext(queue) : null;
		});
	};
	// the method we expose will do some simple auto-queuing for us
	// to avoid the long text problems and keep things simple..
	// periods make for a natural place to pause, so this isn't
	// 'bullet proof' but in practice it seems to work pretty well.

	BasicVoiceSpeaker.prototype.say = function say(text) {
		var _this3 = this;

		var queue = [],
		    ret = undefined;
		if (text.length > 64) {
			text.split(/[.,&"\n]/).forEach(function (shortText) {
				queue.push(shortText);
			});
		} else {
			queue.push(text);
		}

		ret = BasicVoiceSpeaker.__last.then(function () {
			return _this3.__sayNext(queue).then(function () {
				console.log('all my speaking should be done now');
			});
		});
		BasicVoiceSpeaker.__last = ret;
		return ret;
	};

	return BasicVoiceSpeaker;
}();