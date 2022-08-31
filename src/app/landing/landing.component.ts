import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UsernamePasswordLoginModel } from '../classes/username-password-login-model.class';

import { map } from 'rxjs/operators';
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
  isModalOpen = false;
  isforgotPasswordModalOpen = false;
  permissionToken = '';
  resetPasswordToken= '';
  forwardData: {
    username: string,
    password: string,
    token: string,
  }
  public resetPasswordForm: FormGroup;
  public credentialsForm: FormGroup;
  public forgotPasswordForm: FormGroup;
  public hide = {
    hideFirstInput: false,
    hideSecondInput: false,
    hideThirdInput: false,
    hideCredentialsPassword: false
  };
  constructor(
    private elRef: ElementRef,
    private iab: InAppBrowser,
    private _http: HttpClient,
    ) {
      this.forgotPasswordForm = new FormGroup({
        email: new FormControl('', Validators.compose([Validators.required],)),
      });
      this.credentialsForm = new FormGroup({
        username: new FormControl('', Validators.compose([Validators.required])),
        password: new FormControl('', Validators.compose([Validators.minLength(6),Validators.required]))
      });
      this.resetPasswordForm = new FormGroup({
        oldPassword: new FormControl('', Validators.compose([Validators.minLength(6),Validators.required])),
        newPassword: new FormControl('', Validators.compose([Validators.minLength(8), Validators.required, this.confirmPassword.bind(this)])),
        newPasswordConfirm: new FormControl('', Validators.compose([Validators.minLength(8), Validators.required,this.confirmPassword.bind(this)]))
      });
    }

  userCredentials = '';
  @ViewChild('listenerOut', { static: true }) listenerOut: ElementRef;
  private values: string[] = ['credentials', 'biometric'];

  accordionGroupChange = (ev: any) => {
    const collapsedItems = this.values.filter(value => value !== ev.detail.value);
    const selectedValue = ev.detail.value;
    if (selectedValue === this.values[1]) {
         Storage.get({ key:'credentials'}).then(
          (validCredentials) => {
            if (validCredentials.value) {
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
        // console.log('Push registration success, token: ' + token.value);
        this.setNotificationPermissionToken(token.value);
      }
    );

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',
      (error: any) => {
      }
    );

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        const username = notification.data.username
        this.onNotificationInboxRedirection(username);
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        const username = notification.notification.data.username
        this.onNotificationInboxRedirection(username);
      }
    );
  }

  onNotificationInboxRedirection(username: string) {
    let userCredentials = new UsernamePasswordLoginModel();
    Storage.get({ key:'credentials'}).then(
      (validCredentials) => {
        if (validCredentials.value) {
          userCredentials = JSON.parse(validCredentials.value);
          if (username.toLowerCase() === userCredentials.username.toLowerCase()) {
            this.handleInboxRedirection(userCredentials);
          }
        }
      },
      (error) => {
        alert('no credentials');
      }
    );
  }

  fetchNewCredentials() {
    let credentials:UsernamePasswordLoginModel = {
      username: '',
      password: ''
    };
    Storage.get({ key:'credentials'}).then(
      (validCredentials) => {
        credentials = JSON.parse(validCredentials.value);
      },
      (error) => {
        alert('no credentials');
      }
    );
    return credentials;
  }

  closePasswordModal() {
    if (this.isModalOpen) {
      this.isModalOpen = false;
    }
    this.resetPasswordForm.reset();
  }

  openForgotPasswordModal() {
    this.isforgotPasswordModalOpen = true;
  }

  closeforgotPasswordModal() {
    if (this.isforgotPasswordModalOpen) {
      this.isforgotPasswordModalOpen = false;
    }
  }

  private confirmPassword(): {[key:string]: any} | null {
    if (this.resetPasswordForm?.controls?.newPassword?.value === this.resetPasswordForm?.controls?.newPasswordConfirm?.value) {
      this.resetPasswordForm?.controls?.newPassword?.setErrors(null);
      this.resetPasswordForm?.controls?.newPasswordConfirm?.setErrors(null);
    }
    return this.resetPasswordForm?.controls?.newPassword?.value !== this.resetPasswordForm?.controls?.newPasswordConfirm?.value
    ? { passwordMustMatch: true } : null;
  }

  public handlePasswordEye(e, hideInput: string): void {
    e.stopPropagation();
    this.hide[hideInput] = !this.hide[hideInput];
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
        const isAvailable = result.isAvailable;
        const isFaceId = result.biometryType == BiometryType.FACE_ID;
        if (isAvailable) {
          // Authenticate using biometrics before logging the user in
          NativeBiometric.verifyIdentity({
            // reason: "For easy log in",
            title: "MyDatapart",
            subtitle: "Service rund um die Uhr",
            // description: "Maybe a description too?",
          }).then(
            (res) => {
              // Authentication successful
              this.handleInboxRedirection(credentials);
            },
            (error) => {
              // Failed to authenticate
              alert('Unsuccessful biometric login attempt');
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
        return value;
      },
      (error) => {
        alert('no credentials');
      }
    );
  }

  async setNotificationPermissionToken(model) {
    await Storage.set({ key: 'notification-permission-token', value: JSON.stringify({ model }) });
  }
  async get(key: string): Promise<any> {
    const item = await Storage.get({ key: key });
    const value = JSON.parse(item.value);
    this.permissionToken = value.model;
    return this.permissionToken;
  }

  onLoginSubmit() {
    const model = new UsernamePasswordLoginModel();
    let credentials = this.credentialsForm.value;
    model.username = credentials.username.replace(/\s/g, "");
    model.password = credentials.password;
    this.login(model).subscribe(
      (res) => {
      },
      (err) => {
        this.handleLoginError(model, err)
      },
      () => {
      }
    );
  }

  login(user: UsernamePasswordLoginModel, errorMessage = '') {
    const url = 'http://datapart-be.edeja.com/v2/users/login';

    return this._http.post<any>(url, { "username": user.username,"password": user.password }, { observe: 'response' }).pipe(
      map((res: HttpResponse<any>) => this.handleLoginSuccess(user, res))
    );
  }

  onConfirmForgotPassword() {
    this.onforgotPasswordFormSubmit().subscribe(
      (res) => {
      },
      (err) => {
        if (err.status === 404 && err.error.message === 'Failed to find person')
        this.forgotPasswordForm.controls.email.setErrors({'cannotFindPerson': true})
      },
      () => {
      }
    );
  }

  onforgotPasswordFormSubmit() {
    const url = 'http://datapart-be.edeja.com/v2/users/requestPasswordReset';
    const userEmail = this.forgotPasswordForm.value.email.replace(/\s/g, "");
    const forgotPasswordModel = {email: userEmail}
    return this._http.post<any>(url, forgotPasswordModel, ).pipe(
      map((res: HttpResponse<any>) => this.closeforgotPasswordModal()));
  }

  onPasswordFormSubmit() {
    if (!this.resetPasswordForm.valid) {
      return false;
    } else {
      // console.log(this.resetPasswordForm.value)
    }
    const passwordModel = this.resetPasswordForm.value;

    this.resetPasswordOnFirstLogin(passwordModel).subscribe(
      (res) => {
      },
      (err) => {
        if (err.error.reason === "CHANGE_PASSWORD_OLD_PASSWORD_INCORRECT") {
          this.resetPasswordForm.controls.oldPassword.setErrors({'oldPasswordIncorect': true})
        }
      },
      () => {
      }
    );;
  }

  resetPasswordOnFirstLogin(resetPasswordModel: {oldPassword: string, newPassword: string, newPasswordConfirm: string}) {
    const url = 'http://datapart-be.edeja.com/v2/users/changePassword';
    let firstLoginModel = {username: this.credentialsForm.value.username.replace(/\s/g, ""), password: resetPasswordModel.newPasswordConfirm};
    let header = { Authorization: `Bearer ${this.resetPasswordToken}`}
    return this._http.post<any>(url, resetPasswordModel, {headers: header}).pipe(
      map((res: HttpResponse<any>) => this.handleLoginSuccess(firstLoginModel, res))
      // catchError((res: HttpErrorResponse) => this.handleLoginError(user, res, errorMessage))
    );
  }

  handleLoginSuccess(user: UsernamePasswordLoginModel, response?: HttpResponse<any>) {
    this.closePasswordModal();
    this.credentialsForm.reset();
    this.setCredentials(user).then(() => {
      this.handleInboxRedirection(user);
    });
  }

  handleLoginError(user: UsernamePasswordLoginModel, response: HttpErrorResponse) {
    // let error: ApiError
    if (response.status === 401) {
      if (response.error.message === 'Incorrect Username or Password') {
       this.credentialsForm.controls.password.setErrors({'incorrectCredentials': true});
      }

      if (response.error.message === 'First login password reset needed') {
        this.resetPasswordToken = response.headers.get('X-AUth-Token-Update');
        this.isModalOpen = true;
      }
    }
    return throwError(response);

  }

  async notificationTokenGet() {
    this.permissionToken = await this.get('notification-permission-token');
  }

  handleInboxRedirection(validCredentials) {
    // const secretKey = "abc";
    // const simpleCrypto1 = new SimpleCrypto(secretKey);
    // const encryptedObject = simpleCrypto1.encrypt(validCredentials).toString();
    // const dec = simpleCrypto1.decrypt(encryptedObject);
    // const data = {validCredentials};
    // const strignified = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    // const strignified = JSON.stringify(data)
    this.notificationTokenGet().then(()=> {
      let forwardData = Object();
      const token = this.permissionToken
      const data = [validCredentials, token]
      if (validCredentials.value) {
        const parsedValue = JSON.parse(validCredentials.value);
        forwardData.username = parsedValue.username
        forwardData.password = parsedValue.password
      } else {
        forwardData.password = validCredentials.password;
        forwardData.username = validCredentials.username;
      }
      forwardData.token = this.permissionToken;
      const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(forwardData), 'Edeja $secret$').toString();
      const encoded  = encodeURIComponent(ciphertext.toString());
      const bytes  = CryptoJS.AES.decrypt(ciphertext, 'Edeja $secret$').toString(CryptoJS.enc.Utf8);
      // const originalText = bytes.toString(CryptoJS.enc.Utf8);
      const browser = this.iab.create(`http://ebox-datapart.edeja.com/datapart/handle-inbox-app-redirection?ciphertext=${encoded}`, '_blank', 'location=no');
      // const browser = this.iab.create(`http://10.5.20.159:4000/handle-inbox-app-redirection?ciphertext=${encoded}`, '_blank', 'location=no');
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
