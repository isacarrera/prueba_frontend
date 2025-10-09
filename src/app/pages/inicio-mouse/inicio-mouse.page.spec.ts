import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioMousePage } from './inicio-mouse.page';

describe('InicioMousePage', () => {
  let component: InicioMousePage;
  let fixture: ComponentFixture<InicioMousePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InicioMousePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
