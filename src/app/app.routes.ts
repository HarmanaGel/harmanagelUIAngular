import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CartComponent } from './cart/cart.component';
import { ProductComponent } from './product/product.component';
import { PaymentSuccessComponent } from './payment/payment-success/payment-success.component';
import { authGuard, guestGuard } from './guard/auth.guard';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './login/register.component';
import { AuctionComponent } from './auction/auction.component';
import { AuctionDetailComponent } from './auction/auction-detail/auction-detail.component';
import { AuctionCreateComponent } from './auction/auction-create/auction-create.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products/:id',
    component: ProductComponent,
  },
  {
    path: 'PaymentSuccess',
    component: PaymentSuccessComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard] // Sadece giriş yapmamış kullanıcılar
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard] // Sadece giriş yapmamış kullanıcılar
  },
  {
    path: 'auction',
    component: AuctionComponent,
  },
  {
    path: 'auction/create',
    component: AuctionCreateComponent,
    canActivate: [authGuard]
  },
  {
    path: 'auction/:id',
    component: AuctionDetailComponent,
  },
];
