class ListenerPausingVoiceSpeaker extends BasicVoiceSpeaker{
	say(text) {
	    return (window._voiceListener) ? window._voiceListener.pauseWhile(super.say(text)) : super.say(text)
   	}
}

window._voiceListener = new PauseableVoiceListener()
