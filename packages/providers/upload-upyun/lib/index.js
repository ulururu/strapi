'use strict';

const upyun = require('upyun')

module.exports = {
  init: (config) => {
    const { serviceName, operatorName, password } = config
    const service = new upyun.Service(serviceName, operatorName, password)
    const client = new upyun.Client(service);

    return {
      upload: (file) => {
        const folderPath = file?.folderPath || '';
        const wm = file?.wm || false;
        
        return new Promise((resolve, reject) => {
          const path = config.uploadPath || '';
          const fileFolder = folderPath || '';
          const fileName = `${file.hash}${file.ext}`;
          const fullPath = `${path}${fileFolder}/${fileName}`;

          const fileBuffer = Buffer.from(file.buffer, 'binary');
          const watermarkOptions = wm ? { "x-gmkerl-thumb": '/unsharp/true/quality/50/watermark/url/' + btoa('/wm/bsb.png') + '/opacity/35/percent/50/align/center/max/3000' } : {};

          client.formPutFile(fullPath, fileBuffer, watermarkOptions)
            .then(() => {
              let baseUrl = config.baseUrl.replace(/\/$/, '');
              file.url = `${baseUrl}/${fullPath}`;
              resolve()
            }).catch((error) => reject(error))
        });
      },
      uploadStream: async (file) => {
        strapi.log.debug('=== 开始上传文件 ===');
        strapi.log.debug('文件对象类型:' + typeof file);
        strapi.log.debug('文件对象键:' + Object.keys(file));
        strapi.log.debug('文件对象原始值:' + file);
        strapi.log.debug('文件对象序列化:' + JSON.stringify(file, (key, value) => {
          if (value instanceof Buffer) {
            return '<Buffer>';
          }
          return value;
        }, 2));
        
        const folderPath = file?.folderPath || '';
        const wm = file?.wm || false;
        //strapi.log.debug('水印选项:' + JSON.stringify(file));
        strapi.log.debug('wm 原始值:' + file?.wm);
        strapi.log.debug('wm 处理后值:' + wm);
        strapi.log.debug('folderPath 原始值:' + file?.folderPath);
        strapi.log.debug('folderPath 处理后值:' + folderPath);

        const path = config.uploadPath || '';
        const fileFolder = folderPath || '';
        const fileName = `${file.hash}${file.ext}`;
        const fullPath = `${path}${fileFolder}/${fileName}`;

        try {
          // 检查是否有 buffer 或 stream
          if (!file.buffer && !file.stream) {
            throw new Error('File buffer or stream is required');
          }

          const fileBuffer = file.buffer ? Buffer.from(file.buffer, 'binary') : null;
          const watermarkOptions = wm ? { "x-gmkerl-thumb": '/unsharp/true/quality/50/watermark/url/' + btoa('/wm/bsb.png') + '/opacity/35/percent/50/align/center/max/3000' } : {};

          strapi.log.debug('水印选项:' + JSON.stringify(watermarkOptions));

          if (fileBuffer) {
            // 使用 buffer 上传
            const { partCount, uuid } = await client.initMultipartUpload(fullPath, fileBuffer, watermarkOptions);

            await Promise.all(
              Array.from({ length: partCount }, (_, index) => 
                client.multipartUpload(fullPath, fileBuffer, uuid, index)
              )
            );

            const result = await client.completeMultipartUpload(fullPath, uuid);
            let baseUrl = config.baseUrl.replace(/\/$/, '');
            file.url = `${baseUrl}/${fullPath}`;
            return result;
          } else if (file.stream) {
            // 使用 stream 上传
            const result = await client.putFile(fullPath, file.stream, watermarkOptions);
            let baseUrl = config.baseUrl.replace(/\/$/, '');
            file.url = `${baseUrl}/${fullPath}`;
            return result;
          }
        } catch (error) {
          strapi.log.error('上传文件失败:', error);
          throw error;
        }
      },
      delete: (file) => {
        const url = file?.url;
        const folderPath = file?.folderPath || '';
        
        return new Promise((resolve, reject) => {
          const path = config.uploadPath || '';
          const fileFolder = folderPath || '';
          const fileName = `${file.hash}${file.ext}`;
          const fullPath = url?.startsWith(config.baseUrl) 
            ? url.replace(`${config.baseUrl.slice(0, -1)}`, '') 
            : `${path}${fileFolder}/${fileName}`;

          client.deleteFile(fullPath)
            .then(() => resolve())
            .catch((error) => reject(error));
        });
      }
    };
  }
};