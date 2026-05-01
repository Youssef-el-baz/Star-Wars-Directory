import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StarshipGridComponent } from './components/starship-grid/starship-grid.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, StarshipGridComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  searchTerm = '';
}
