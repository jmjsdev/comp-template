import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-__templateNameToDashCase__",
  templateUrl: "./__templateNameToDashCase__.component.html",
  styleUrls: ["./__templateNameToDashCase__.component.css"],
})
export class __templateNameToPascalCase__Component {
  @Input() title: string = "__templateNameToPascalCase__";
  @Input() data: any;

  @Output() onClick = new EventEmitter<any>();

  handleClick(): void {
    this.onClick.emit(this.data);
  }
}
