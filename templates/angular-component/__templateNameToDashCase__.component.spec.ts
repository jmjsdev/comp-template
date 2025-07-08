import { ComponentFixture, TestBed } from "@angular/core/testing";
import { __templateNameToPascalCase__Component } from "./__templateNameToDashCase__.component";

describe("__templateNameToPascalCase__Component", () => {
  let component: __templateNameToPascalCase__Component;
  let fixture: ComponentFixture<__templateNameToPascalCase__Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [__templateNameToPascalCase__Component],
    }).compileComponents();

    fixture = TestBed.createComponent(__templateNameToPascalCase__Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have default title", () => {
    expect(component.title).toBe("__templateNameToPascalCase__");
  });

  it("should emit onClick event", () => {
    spyOn(component.onClick, "emit");
    component.data = "test";

    component.handleClick();

    expect(component.onClick.emit).toHaveBeenCalledWith("test");
  });
});
