import * as vscode from "vscode";
import { getNonce } from "./getNonce";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const startRecordingUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "logic/startRecording.js")
    )

    const RecorderUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "logic/voiceRecorder.js")
    )

    const PageUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "record.html")
    )

    return `

    <!DOCTYPE html>
<html>

<head>
 
</head>
<body>
  <h1 style="color:blue">Voice note recorder</h1>

   <!-- ------------ -->
   <br>
   <hr>
   <!-- ------------ -->
   <div class="display-none" id="audio_rec">
      <h3> Record Audio</h3>
      <button type="button" id="aud_st"
      onclick="getMedia({audio: true})"><i class="fa fa-play"></i>
      </button>
      <button type="button" id="aud_en"
      disabled onclick="stop_Recording(this, document.getElementById('aud_st'))"> <i class="fa fa-stop"></i></button>
   </div>
<script>
//--------------------audio---------------------------------------


async function getMedia(constraints) {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Here");
    /* use the stream */
  } catch(err) {
    /* handle the error */
    console.log("Shame");
    console.log(err);
  }
}

function start_audio_Recording() {
   //To stores the recorded media
   let chunksArr = [];
   const startBtn=document.getElementById("aud_st");
   const endBtn=document.getElementById("aud_en");
   
   // Access the camera and microphone
   navigator.mediaDevices.getUserMedia({audio: true})
   .then((mediaStream) => {
      const medRec = new MediaRecorder(mediaStream);
      window.mediaStream = mediaStream;
      window.mediaRecorder = medRec;
      medRec.start();
      
   //when recorded data is available then push into chunkArr array
   medRec.ondataavailable = (e) => {
      chunksArr.push(e.data);
   };
   
   //stop the audio recording
      medRec.onstop = () => {
         const blob = new Blob(chunksArr, {type: "audio/mpeg"});
         chunksArr = [];
         
         // create audio element and store the media which is recorded
         const recMediaFile = document.createElement("audio");
         recMediaFile.controls = true;
         const RecUrl = URL.createObjectURL(blob);
         recMediaFile.src = RecUrl;
         document.getElementById("audio_rec").append(
         recMediaFile);
      };
      startBtn.disabled = true;
      endBtn.disabled = false;
   });
}
function stop_Recording(end, start) {
   //stop all tracks
   window.mediaRecorder.stop();
   window.mediaStream.getTracks() .forEach((track) => {track.stop();});
      //disable the stop button and enable the start button
      end.disabled = true;
      start.disabled = false;
   }
</script>
</body>
</html>

`;
  }}