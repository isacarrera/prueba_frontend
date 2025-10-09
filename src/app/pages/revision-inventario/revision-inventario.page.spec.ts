import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevisionInventarioPage } from './revision-inventario.page';

describe('RevisionInventarioPage', () => {
  let component: RevisionInventarioPage;
  let fixture: ComponentFixture<RevisionInventarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RevisionInventarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
