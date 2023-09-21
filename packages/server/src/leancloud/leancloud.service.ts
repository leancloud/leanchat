import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { LeanCloudFile } from './interfaces';

@Injectable()
export class LeanCloudService {
  async getFile(id: string): Promise<LeanCloudFile | undefined> {
    const query = new AV.Query('_File').equalTo('objectId', id);
    const fileObj = await query.first({ useMasterKey: true });
    if (fileObj) {
      return {
        id: fileObj.id!,
        url: fileObj.get('url'),
        name: fileObj.get('name'),
        mime: fileObj.get('mime_type'),
        size: fileObj.get('metaData')?.size,
      };
    }
  }
}
