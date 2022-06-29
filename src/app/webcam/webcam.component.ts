import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-webcam',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.scss']
})
export class WebcamComponent implements OnInit {

  WIDTH = 1024;
  HEIGHT = 768;


  @ViewChild('video', { static: true })
  public video: ElementRef;

  @ViewChild('canvas', { static: true })
  public canvasRef: ElementRef;

  constructor(private elRef: ElementRef) { }
  stream: any;
  detection: any;
  resizedDetections: any;
  canvas: any;
  canvasEl: any;
  displaySize: any;
  videoInput: any;
  referenceImage = new Image;
  image = '';

  async ngOnInit() {
    // await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri('../../assets/models'),
    // await faceapi.nets.faceLandmark68Net.loadFromUri('../../assets/models'),
    // await faceapi.nets.faceRecognitionNet.loadFromUri('../../assets/models'),
    // await faceapi.nets.faceExpressionNet.loadFromUri('../../assets/models'),]).then(() => this.startVideo());
    // debugger;
    // this.captureImage();
    alert('here')
    }

    async captureImage() {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        source: CameraSource.Prompt,
        resultType: CameraResultType.Base64
      })
      if (image) {
        this.image = `data:image/jpeg;base64,${image.base64String}`!;
        alert(image);
      }
    }

    // startVideo() {
    //   this.videoInput = this.video.nativeElement;
    //   const constraints = { audio: false, video: { width: 1024, height: 768 } };
    //   navigator.mediaDevices.getUserMedia(constraints)
    //   .then(function(mediaStream) {
    //     var video = document.querySelector('video');
    //     video.srcObject = mediaStream;
    //     video.onloadedmetadata = function(e) {
    //       video.play();
    //     };
    //   })
    //   .catch(function(err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.

    // this.detect_Faces();
    // }

    // async detect_Faces() {
    //   this.referenceImage.src = '../../assets/samples/sample.jpg'
    //   this.elRef.nativeElement.querySelector('video').addEventListener('play', async () => {
    //    this.canvas = await faceapi.createCanvasFromMedia(this.videoInput);
    //    this.canvasEl = this.canvasRef.nativeElement;
    //    this.canvasEl.appendChild(this.canvas);
    //    this.canvas.setAttribute('id', 'canvass');
    //    this.canvas.setAttribute(
    //       'style',`position: fixed;
    //       top: 0;
    //       left: 0;`
    //    );
    //    this.displaySize = {
    //       width: this.videoInput.width,
    //       height: this.videoInput.height,
    //    };
    //    faceapi.matchDimensions(this.canvas, this.displaySize);
    //    setInterval(async () => {
    //      //  this.detection = await faceapi.detectAllFaces(this.videoInput, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    //      //  this.resizedDetections = faceapi.resizeResults(
    //      //     this.detection,
    //      //     this.displaySize
    //      //   );
    //      //  this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width,this.canvas.height);
    //      //  faceapi.draw.drawDetections(this.canvas, this.resizedDetections);
    //      //  faceapi.draw.drawFaceLandmarks(this.canvas, this.resizedDetections);
    //      //  faceapi.draw.drawFaceExpressions(this.canvas, this.resizedDetections);
    //      const results = await faceapi
    //        .detectAllFaces(this.referenceImage, new faceapi.TinyFaceDetectorOptions())
    //        .withFaceLandmarks()
    //        .withFaceDescriptors();

    //      if (!results.length) {
    //        return
    //      }

    //      // create FaceMatcher with automatically assigned labels
    //      // from the detection results for the reference image
    //      const faceMatcher = new faceapi.FaceMatcher(results);
    //      const singleResult = await faceapi
    //        .detectSingleFace(this.videoInput, new faceapi.TinyFaceDetectorOptions())
    //        .withFaceLandmarks()
    //        .withFaceDescriptor()
    //        .withFaceExpressions()
    //        this.resizedDetections = faceapi.resizeResults(
    //         singleResult,
    //          this.displaySize
    //        );
    //       this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width,this.canvas.height);
    //       faceapi.draw.drawDetections(this.canvas, this.resizedDetections);
    //       faceapi.draw.drawFaceLandmarks(this.canvas, this.resizedDetections);
    //       faceapi.draw.drawFaceExpressions(this.canvas, this.resizedDetections);
    //       const checkResult = singleResult.descriptor;
    //       console.log(checkResult);

    //      if (singleResult) {
    //        const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor);
    //        console.log(bestMatch.toString());
    //      }
    //    }, 100);
    //   });
    //   }

}
