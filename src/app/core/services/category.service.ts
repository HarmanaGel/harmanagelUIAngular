import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../../shared/models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Placeholder kategoriler için resimler
  private categoryImages: { [key: string]: string } = {
    'araçlar': 'https://images.unsplash.com/photo-1494976688023-cd2c5adb3c04?w=400&h=300&fit=crop',
    'organik ürünler': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    'animals': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop',
    'elektronik': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop',
    'gıda': 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=400&h=300&fit=crop',
    'giyim': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop',
    'ev': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    'spor': 'https://images.unsplash.com/photo-1571019613540-996a69b1bb0e?w=400&h=300&fit=crop'
  };

  getMainCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/api/app/category/main-categories`).pipe(
      map(categories => categories.map(category => ({
        ...category,
        imageUrl: this.getCategoryImage(category.name)
      })))
    );
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/api/app/category/${id}`).pipe(
      map(category => ({
        ...category,
        imageUrl: this.getCategoryImage(category.name)
      }))
    );
  }

  private getCategoryImage(categoryName: string): string {
    const key = categoryName.toLowerCase();
    return this.categoryImages[key] || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop';
  }
}