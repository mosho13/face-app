import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
//import { Browser } from '@capacitor/browser';
// import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Storage } from '@capacitor/storage';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

import { AvailableResult, BiometryType, NativeBiometric } from "capacitor-native-biometric";
import { UsernamePasswordLoginModel } from '../classes/username-password-login-model.class';
// import { toModel } from '../utils/resource-model.util';
import { map, catchError } from 'rxjs/operators';
// import { ApiError } from '../classes/api-error';
import { throwError } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import SimpleCrypto from "simple-crypto-js"

// export declaration not working, checking for now, needs to be fixed

 export declare class ApiError {
  apiUrl: string;
  statusCode: string;
  errorMessage: string;
  error: any;
  constructor(apiUrl: string, statusCode: string, errorMessage: string, error?: any);
  toString(): string;
}




@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  username = new FormControl('', [])
  password = new FormControl('', [])

  constructor(
    private elRef: ElementRef,
    private iab: InAppBrowser,
    private _http: HttpClient
    ) { }

  userCredentials = '';
  @ViewChild('listenerOut', { static: true }) listenerOut: ElementRef;
  private values: string[] = ['credentials', 'biometric'];

  accordionGroupChange = (ev: any) => {
    // const nativeEl = this.listenerOut.nativeElement;
    // if (!nativeEl) { return; }

    const collapsedItems = this.values.filter(value => value !== ev.detail.value);
    const selectedValue = ev.detail.value;
    if (selectedValue === this.values[1]) {
         Storage.get({ key:'credentials'}).then(
          (validCredentials) => {
            console.log(validCredentials);
            console.log(typeof validCredentials);
            if (!validCredentials) {
              this.startBiometricauthentification(validCredentials)
            } else {
              this.showPopupDialog();
            }
          },
          (error) => {
            alert('no credentials');
          }
        );
      }

    }

  async ngOnInit() {
  }

  async showPopupDialog() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Login information ';
    alert.subHeader = 'Important message';
    alert.message = 'You must first time login with credentials';
    alert.buttons = ['OK'];

    document.body.appendChild(alert);
    await alert.present();
  }
  startBiometricauthentification (credentials: any) {
    NativeBiometric.isAvailable().then(
      (result: AvailableResult) => {
        // alert(result.biometryType);
        const isAvailable = result.isAvailable;
        // alert(isAvailable);
        const isFaceId = result.biometryType == BiometryType.FACE_ID;
        // alert(isFaceId);

        if (isAvailable) {
          // Authenticate using biometrics before logging the user in
          NativeBiometric.verifyIdentity({
            reason: "For easy log in",
            title: "Log in",
            subtitle: "Maybe add subtitle here?",
            description: "Maybe a description too?",
          }).then(
            (res) => {
              // Authentication successful
              // this.login(credentials.username, credentials.password);
              this.handleInboxRedirection(credentials);
              alert('uspesan login');
              console.log(res);
            },
            (error) => {
              // Failed to authenticate
              alert('Neuspesan login');
            }
          );
        }
      },
      (error) => {
        // Couldn't check availability
        alert('Couldnt check availability')
      }
    );

  }

  async setCredentials(model: UsernamePasswordLoginModel) {
    let username = model.username;
    let password = model.password;
    await Storage.set({ key: 'credentials', value: JSON.stringify({ username, password }) });
  }

  async setAccessToken(model) {
    await Storage.set({ key: 'ebox-access-token', value: JSON.stringify({ model }) });
  }

  async getCredentials() {
    await Storage.get({ key: 'credentials' }).then(
      (value) => {
        console.log(value);
        console.log(typeof value);
        return value;
      },
      (error) => {
        alert('no credentials');
      }
    );
  }

  onLoginSubmit() {
    const model = new UsernamePasswordLoginModel();
    model.username = this.username.value;
    model.password = this.password.value;
    this.login(model).subscribe(
      (res) => {
        //
        console.log(res);
      },
      (err) => {
       //
      },
      () => {
        //this.authenticating = false;
      }
    );
  }

  login(user: UsernamePasswordLoginModel, errorMessage = '') {
    // const url = `${this._config.apiUrl}${this._config.loginRoute}`;
    const url = 'http://datapart-be.edeja.com/v2/users/login';

    return this._http.post<any>(url, { "username": user.username,"password": user.password }, { observe: 'response' }).pipe(
      map((res: HttpResponse<any>) => this.handleLoginSuccess(user, res)),
      catchError((res: HttpErrorResponse) => this.handleLoginError(res, errorMessage))
    );
  }

  handleLoginSuccess(user: UsernamePasswordLoginModel, response: HttpResponse<any>) {
    const accessToken = response.headers.get('X-Auth-Token-Update');
    this.setAccessToken(accessToken);
    this.setCredentials(user);
    this.handleInboxRedirection(user);
  }

  handleLoginError(response: HttpErrorResponse, errorMessage: string) {
    let error: ApiError;
    if (response.status === 401) {
      error = new ApiError(
        response.url,
        response.status.toString(),
        errorMessage || (response.error && response.error.message),
      );
    }
    return throwError(error);

  }

  handleInboxRedirection(validCredentials) {
    // const secretKey = "abc";
    // const simpleCrypto1 = new SimpleCrypto(secretKey);
    // const encryptedObject = simpleCrypto1.encrypt(validCredentials).toString();
    // console.log(encryptedObject);
    // const dec = simpleCrypto1.decrypt(encryptedObject);
    const data = {validCredentials};
    // const strignified = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    // const strignified = JSON.stringify(data)
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(validCredentials), 'abc').toString();
    const encoded  = encodeURIComponent(ciphertext.toString());
    // console.log(ciphertext);
    const bytes  = CryptoJS.AES.decrypt(encoded, 'abc').toString(CryptoJS.enc.Utf8);
    console.log(bytes);
    // const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // const browser = this.iab.create('http://ebox-datapart.edeja.com/datapart/handle-inbox-app-redirection', '_blank', 'location=no');
    const browser = this.iab.create(`http://10.5.20.159:4000/handle-inbox-app-redirection?ciphertext=${encoded}`, '_blank', 'location=no');
    browser.on('loadstart').subscribe(event => {
      // browser.executeScript({ code: `localStorage.setItem('ebox-credentials', ${ciphertext})` });
      browser.executeScript({code: 'console.log("foo")'});
      // crypto_js__WEBPACK_IMPORTED_MODULE_1__.AES.decrypt(queryParams.ciphertext, 'abc').toString(crypto_js__WEBPACK_IMPORTED_MODULE_1__.enc.Latin1)
   });

  }
}
