import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Project, Document } from '@entities';

import { DocumentsService } from '@documents/documents.service';

import { DocumentsController } from '@documents/documents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Project])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule { }
