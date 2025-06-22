import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionCreateComponent } from './auction-create.component';

describe('AuctionCreateComponent', () => {
  let component: AuctionCreateComponent;
  let fixture: ComponentFixture<AuctionCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
