import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemsPagePage } from './items-page.page';

describe('ItemsPagePage', () => {
  let component: ItemsPagePage;
  let fixture: ComponentFixture<ItemsPagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemsPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
