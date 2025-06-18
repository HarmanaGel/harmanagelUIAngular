import { Component, inject, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ProductOfferComponent } from '../shared/components/product-offer/product-offer.component';
import { Product } from '../shared/models/product';
import { HomeProductComponent } from './components/home-product/home-product.component';
import { ProductService } from '../core/services/product.service';
import { AsyncPipe } from '@angular/common';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { CategoryService } from '../core/services/category.service';
import { Category } from '../shared/models/category';
import { CategoryCardComponent } from '../caregory/category-card.component';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-home',
  imports: [HomeProductComponent, AsyncPipe, CategoryCardComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  cdr = inject(ChangeDetectorRef);

  products$: Observable<Product[]> = this.productService.getAll();
  categories$: Observable<Category[]>;
  categoriesLoaded = false;
  currentCategoryIndex = 0;
  autoSlideInterval?: number;
  flowbiteInitialized = false;

  constructor() {
    this.categories$ = this.categoryService.getMainCategories().pipe(
      tap((categories) => {
        if (categories && categories.length > 0) {
          this.categoriesLoaded = true;
          setTimeout(() => this.initializeFlowbite(), 0);
        }
      }),
    );
  }

  ngOnInit(): void {}

  private initializeFlowbite(): void {
    if (!this.flowbiteInitialized) {
      console.log('Initializing Flowbite...');
      initFlowbite();
      this.flowbiteInitialized = true;
      this.cdr.detectChanges();
    }
  }
}