import {Readable} from 'stream';

import {Task} from '../managers/tasks';
import ReaderStream from '../readers/stream';
import {Entry, ErrnoException, ReaderOptions} from '../types';
import Provider from './provider';

export default class ProviderStream extends Provider<Readable> {
  protected _reader: ReaderStream = new ReaderStream(this._settings);

  public read(task: Task): Readable {
    const root    = this._getRootDirectory(task);
    const options = this._getReaderOptions(task);

    const source      = this.api(root, task, options);
    const destination = new Readable({
      objectMode: true, read: (): void => { /* noop */
      },
    });

    source
      .once('error', (error: ErrnoException) => destination.emit('error', error))
      .on('data', (entry: Entry) => destination.emit('data', options.transform(entry)))
      .once('end', () => destination.emit('end'));

    destination
      .once('close', () => source.destroy());

    return destination;
  }

  public api(root: string, task: Task, options: ReaderOptions): Readable {
    if (task.dynamic) {
      return this._reader.dynamic(root, options);
    }

    return this._reader.static(task.patterns, options);
  }
}
