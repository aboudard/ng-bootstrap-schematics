import { Component, OnInit } from '@angular/core';
import { User } from './dto/user';
import { InfoActuator } from './dto/info-actuator';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  title = "Angular";
  user: User = {
    badge: "P22221",
    nom: "POP",
    prenom: "User",
    sitesGestion: ["POPO4"],
    sgLabel: "Pop poppo",
    posteOp: "POPPO",
    habilitations: ["EDIT"],
    profil: "Administrateur",
    version: "V-1.0.1",
  };
  infoConnection = {
    lastLogin: 1582820287,
    currentTime: Date.now(),
  };
  urlLogo = "assets/img/logo_accueil.png";
  infos: Partial<InfoActuator> = {
    app: { version: "RC-1.2.14-977", env: "devt" },
    git: {
      branch: "master",
      commit: { id: "40b5a74", time: "2020-12-16T10:54:22Z" },
    },
    build: {
      artifact: "bj-svc",
      name: "bj-svc",
      time: "2020-12-16T10:54:59.262Z",
      version: "unspecified",
      group: "fr.abo",
    },
  };
  year = "2020";

  constructor() {}

  ngOnInit(): void {}
}
