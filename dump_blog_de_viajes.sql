CREATE DATABASE blog_de_viajes;
USE blog_de_viajes;

CREATE TABLE autores(
    id int not null auto_increment,
    email varchar(50) not null,
    contrasena varchar(40) not null,
    pseudonimo varchar(255) not null,
    avatar varchar(255),
    primary key(id)
);

CREATE TABLE publicaciones(
    id int not null auto_increment,
    titulo varchar(50) not null,
    resumen varchar(255) not null,
    contenido varchar(255) not null,
    autor_id int not null,
    foto varchar(255),
    votos int DEFAULT 0,
    fecha_hora timestamp,
    primary key(id),
    constraint fk_publicaciones_has_autores foreign key (autor_id)
    references autores(id)
);

INSERT INTO autores (email, contrasena, pseudonimo) 
VALUES ('luis@email.com','123123','luis2000');

INSERT INTO autores(email, contrasena, pseudonimo)
VALUES ('ana@email.com','123123','ana55555');

INSERT INTO `publicaciones` VALUES 
(1,'Roma','Buen viaje a Roma','Contenido',1,NULL,0,'2018-09-10 01:08:27'),
(2,'Grecia','Buen viaje a Grecia','Contenido</p>',1,NULL,0,'2018-09-11 01:08:27'),
(3,'Paris','Buen viaje a Paris','Contenido',1,NULL,0,'2018-09-12 01:08:27'),
(4,'Costa Rica','Buen viaje a Costa Rica','Contenido',2,NULL,0,'2018-09-13 01:08:27'),
(5,'Mar de Plata','Buen viaje a Mar de Plata','Contenido',2,NULL,0,'2018-09-14 01:08:27'),
(6,'Guadalajara','Buen viaje a Guadalajara','Contenido',2,NULL,0,'2018-09-15 01:08:27'),
(7,'China','Buen viaje a China','Contenido',2,NULL,2,'2018-09-16 01:08:27');