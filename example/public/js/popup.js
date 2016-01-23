document.addEventListener("DOMContentLoaded", function(event) { 
      //HTML ELEMENTS FOR DISPLAYING RESPONSE AND INFO JSON's
      var jsonElet = document.getElementById("responseJSON");
      var infoElet = document.getElementById("infoJSON");


      //REQUEST INFO JSON
      var requestInfo = {
         PartialTranscriptsDesired: true,
         ClientID: "sURdJjkCH_yX_yAW3WYXbA=="
      };


      //INITIALIZE COMMON CONVERSATION OBJECT FOR STORING CONVERSATION STATE
      var myConversation = new Hound.Conversation();


      //INITIALIZE VOICE SEARCH OBJECT
      var voiceSearch = new Hound.VoiceSearch({

        // provide client information here if connection is secure
        // to skip the authentication on server side
        client: {
           clientId: "sURdJjkCH_yX_yAW3WYXbA==",
           clientKey: "rEsvUzqvDT0JvQAA3H1VZZAqNZJUbra33lUqq3CLDMuxYETfFurSJNJ2etxelvzXgBnd5Imzn9Yqums1cw81Ug=="
         },

        authenticationURI: "/voiceSearchAuth",

        conversation: myConversation,

        enableVAD: true,

        onTranscriptionUpdate: function(trObj) {
          var transcriptElt = document.getElementById("query");
          transcriptElt.value = trObj.PartialTranscript;
        },

        onResponse: function(response, info) {
          if (response.AllResults && response.AllResults[0] !== undefined) {
            jsonElet.value = JSON.stringify(response, undefined, 2);
            jsonElet.parentNode.hidden = false;
            infoElet.value = JSON.stringify(info, undefined, 2);
            infoElet.parentNode.hidden = false;
          }
        },

        onAbort: function(info) {},

        onError: function(err, info) {
          jsonElet.parentNode.hidden = true;
          infoElet.value = JSON.stringify(info, undefined, 2);
          infoElet.parentNode.hidden = false;
          document.getElementById("voiceIcon").className = "unmute big icon";
        },

        onRecordingStarted: function() {
          document.getElementById("voiceIcon").className = "selected radio icon big red";
        },

        onRecordingStopped: function(recording) {
          document.getElementById("voiceIcon").className = "unmute big icon";
          document.getElementById("textSearchButton").disabled = false;
          document.getElementById("query").readOnly = false;
        },

        onAudioFrame: function(frame) {}

      });


      //START OR STOP VOICE SEARCH
      function startStopVoiceSearch() {
        if (voiceSearch.isState("streaming")) {
          voiceSearch.stop();
        } else {
          voiceSearch.start(requestInfo);
          document.getElementById("voiceIcon").className = "loading circle notched icon big";
          document.getElementById("textSearchButton").disabled = true;
          document.getElementById("query").readOnly = true;  
        }
      }


      //UPLOAD AUDIO FILE
      function onFileUpload() {
        var fileElt = document.getElementById("file");
        var file = fileElt.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(){
          var arrayBuffer = reader.result;
          voiceSearch.upload(arrayBuffer, requestInfo);
        };
        reader.readAsArrayBuffer(file);
      }


      //INITIALIZE TEXT SEARCH OBJECT
      var textSearch = new Hound.TextSearch({

        proxy: {
          route: "/textSearchProxy",
          method: "GET"
        },

        conversation: myConversation,

        onResponse: function(response, info) {
          if (response.AllResults && response.AllResults[0] !== undefined) {
            jsonElet.value = JSON.stringify(response, undefined, 2);
            jsonElet.parentNode.hidden = false;
            infoElet.value = JSON.stringify(info, undefined, 2);
            infoElet.parentNode.hidden = false;
          }
        },

        onError: function(err, info) {
          jsonElet.parentNode.hidden = true;
          infoElet.value = JSON.stringify(info, undefined, 2);
          infoElet.parentNode.hidden = false;
        }

      });
      

      //START TEXT SEARCH
      function doTextSearch() {
        alert("TEXT SEARCH");
        var query = document.getElementById('query').value;
        textSearch.search(query, requestInfo);

      } 
}
