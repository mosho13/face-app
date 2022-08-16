import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { UsernamePasswordLoginModel } from '../classes/username-password-login-model.class';

import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AvailableResult, BiometryType, NativeBiometric } from "capacitor-native-biometric";
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@capacitor/storage';
import * as CryptoJS from 'crypto-js';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

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

  username = new FormControl('', []);
  password = new FormControl('', []);
  permissionToken = '';
  forwardData: {
    username: string,
    password: string,
    token: string,
  }

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
            if (validCredentials) {
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
    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
      }
    });

    //On success, we should be able to receive notifications
    PushNotifications.addListener('registration',
      (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        alert('Push registration success, token: ' + token.value);
        this.setNotificationPermissionToken(token.value);
      }
    );

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
        alert('Error on registration: ' + JSON.stringify(error));
      }
    );

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        alert('Push received: ' + JSON.stringify(notification));
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        alert('Push action performed: ' + JSON.stringify(notification));
      }
    );
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

  async setAccessToken(model) {
    await Storage.set({ key: 'ebox-access-token', value: JSON.stringify({ model }) });
  }

  async setNotificationPermissionToken(model) {
    await Storage.set({ key: 'notification-permission-token', value: JSON.stringify({ model }) });
  }

  // async getPermissionTokenold() {
  //   await Storage.get({ key: 'notification-permission-token' }).then(
  //     (response) => {
  //       this.permissionToken = response.value;
  //       return response.value;
  //     },
  //     (error) => {
  //       alert('no credentials');
  //     }
  //   );
  // }
  async get(key: string): Promise<any> {
    const item = await Storage.get({ key: key });
    const value = JSON.parse(item.value);
    this.permissionToken = value.model;
    return this.permissionToken;
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

  async notificationTokenGet() {
    this.permissionToken = await this.get('notification-permission-token');
  }

  handleInboxRedirection(validCredentials) {
    // const secretKey = "abc";
    // const simpleCrypto1 = new SimpleCrypto(secretKey);
    // const encryptedObject = simpleCrypto1.encrypt(validCredentials).toString();
    // console.log(encryptedObject);
    // const dec = simpleCrypto1.decrypt(encryptedObject);
    // const data = {validCredentials};
    // const strignified = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    // const strignified = JSON.stringify(data)
    this.notificationTokenGet().then(()=> {
      let forwardData = Object();
      const token = this.permissionToken
      const data = [validCredentials, token]
      forwardData.password = validCredentials.value ? validCredentials.value.password : validCredentials.password;
      forwardData.username = validCredentials.value ? validCredentials.value.username : validCredentials.username;
      forwardData.token = this.permissionToken;
      const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(forwardData), 'Edeja $secret$').toString();
      const encoded  = encodeURIComponent(ciphertext.toString());
      // console.log(ciphertext);
      const bytes  = CryptoJS.AES.decrypt(ciphertext, 'Edeja $secret$').toString(CryptoJS.enc.Utf8);
      console.log(bytes);
      // const originalText = bytes.toString(CryptoJS.enc.Utf8);
      // const browser = this.iab.create(`http://ebox-datapart.edeja.com/datapart/handle-inbox-app-redirection?ciphertext=${encoded}`, '_blank', 'location=no');
      const browser = this.iab.create(`http://10.5.20.159:4000/handle-inbox-app-redirection?ciphertext=${encoded}`, '_blank', 'location=no');
    //   browser.on('loadstart').subscribe(event => {
    //     // browser.executeScript({ code: `localStorage.setItem('ebox-credentials', ${ciphertext})` });
    //     browser.executeScript({code: 'console.log("foo")'});
    //     // crypto_js__WEBPACK_IMPORTED_MODULE_1__.AES.decrypt(queryParams.ciphertext, 'abc').toString(crypto_js__WEBPACK_IMPORTED_MODULE_1__.enc.Latin1)
    // }
    //   );
   }).catch((err) => {
    alert(`Can't fetch permission token`);
   });
  }
}
