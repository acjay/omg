import * as sinon from 'sinon';
import FormatExec from '../../../../src/commands/exec/FormatExec';
import Microservice from '../../../../src/models/Microservice';
import * as utils from '../../../../src/utils';

describe('FormatExec.ts', () => {
  beforeEach(() => {
    sinon.stub(utils, 'getOpenPort').callsFake(async () => 5555);
  });

  afterEach(() => {
    (utils.getOpenPort as any).restore();
  });

  describe('.startService()', () => {
    let utilsDockerCreateContainer;

    beforeEach(() => {
      utilsDockerCreateContainer = sinon.stub(utils.docker, 'createContainer').callsFake(async (data) => {
        return {
          $subject: {
            id: 'fake_docker_id'
          },
          start: () => {}
        }
      });
    })

    afterEach(() => {
      (utils.docker.createContainer as any).restore()
    })

    test('starts service with dev null default', async () => {
      const containerID = await new FormatExec('fake_docker_id', new Microservice({
        omg: 1,
        actions: {
          test: {
            format: {
              command: 'test.sh',
            },
            output: {type: 'string'},
          },
        },
      }), {}, {}).startService();

      expect(utilsDockerCreateContainer.calledWith({
        Image: 'fake_docker_id',
        Cmd: ['tail', '-f', '/dev/null'],
        Env: []
      })).toBeTruthy();
      expect(containerID).toBe('fake_docker_id');
    });

    test('starts service with lifecycle', async () => {
      const containerID = await new FormatExec('fake_docker_id', new Microservice({
        omg: 1,
        actions: {
          test: {
            format: {
              command: 'test.sh',
            },
            output: {type: 'string'},
          },
        },
        lifecycle: {
          startup: {
            command: ['node', 'start.js'],
          },
        },
      }), {}, {}).startService();

      expect(utilsDockerCreateContainer.calledWith({
        Image: 'fake_docker_id',
        Cmd: ['node', 'start.js'],
        Env: []
      })).toBeTruthy();
      expect(containerID).toBe('fake_docker_id');
    });
  });

  describe('.isRunning()', () => {
    let utilsDockerGetContainer;

    beforeEach(() => {
      utilsDockerGetContainer = sinon.stub(utils.docker, 'getContainer').callsFake((container) => {
        return {
          inspect: async () => {
            return {
              State: {
                Running: false
              }
            }
          }
        }
      })
    })

    afterEach(() => {
      (utils.docker.getContainer as any).restore();
    })
    
    test('not running', async () => {
      expect(await new FormatExec('fake_docker_id', new Microservice({
        omg: 1,
        actions: {
          test: {
            format: {
              command: 'test.sh',
            },
            output: {type: 'string'},
          },
        },
        lifecycle: {
          startup: {
            command: ['node', 'start.js'],
          },
        },
      }), {}, {}).isRunning()).toBeFalsy();
    });

    test('running', async () => {
      (utils.docker.getContainer as any).restore();
      utilsDockerGetContainer = sinon.stub(utils.docker, 'getContainer').callsFake((container) => {
        return {
          inspect: async () => {
            return {
              State: {
                Running: true
              }
            }
          }
        }
      })

      expect(await new FormatExec('fake_docker_id', new Microservice({
        omg: 1,
        actions: {
          test: {
            format: {
              command: 'test.sh',
            },
            output: {type: 'string'},
          },
        },
        lifecycle: {
          startup: {
            command: ['node', 'start.js'],
          },
        },
      }), {}, {}).isRunning()).toBeTruthy();
    });
  });

  describe('.exec(action)', () => {
    test('throws an exception because not all required arguments are supplied', async () => {
      try {
        await new FormatExec('fake_docker_id', new Microservice({
          omg: 1,
          actions: {
            tom: {
              format: {
                command: 'tom.sh',
              },
              arguments: {
                foo: {
                  type: 'string',
                  required: true,
                },
              },
            },
          },
        }), {}, {}).exec('tom');
      } catch (e) {
        expect(e).toBe('Need to supply required arguments: `foo`');
      }
    });

    test('throws an exception because not all required environment variables are supplied', async () => {
      try {
        await new FormatExec('fake_docker_id', new Microservice({
          omg: 1,
          actions: {
            tom: {
              format: {
                command: 'tom.sh',
              },
              arguments: {
                foo: {
                  type: 'float',
                  required: true,
                },
              },
            },
          },
          environment: {
            TOKEN: {
              type: 'string',
              required: true,
            },
          },
        }), {
          foo: '1.1',
        }, {}).exec('tom');
      } catch (e) {
        expect(e).toBe('Need to supply required environment variables: `TOKEN`');
      }
    });

    // These tests need to be changed to call `runDockerExecCommand`
    test('runs the action with dev null', async () => {
    //   const formatExec = new FormatExec('fake_docker_id', new Microservice({
    //     omg: 1,
    //     actions: {
    //       test: {
    //         format: {
    //           command: 'test.sh',
    //         },
    //         output: {type: 'string'},
    //       },
    //     },
    //   }), {}, {});
    //   await formatExec.startService();

    //   await formatExec.exec('test');
    //   expect(execStub.args).toEqual([
    //     ['docker run -td --entrypoint tail fake_docker_id -f /dev/null'],
    //     ['docker exec `execStub` test.sh'],
    //   ]);
    });

    // test('runs the action with given lifecycle', async () => {
    //   const formatExec = new FormatExec('fake_docker_id', new Microservice({
    //     omg: 1,
    //     actions: {
    //       test: {
    //         format: {
    //           command: 'test.sh',
    //         },
    //         output: {type: 'string'},
    //       },
    //     },
    //     lifecycle: {
    //       startup: {
    //         command: ['start.sh', 'arg1'],
    //       },
    //     },
    //   }), {}, {});
    //   await formatExec.startService();

    //   await formatExec.exec('test');
    //   expect(execStub.args).toEqual([
    //     ['docker run -td --entrypoint start.sh fake_docker_id arg1'],
    //     ['docker exec `execStub` test.sh'],
    //   ]);
    // });

  //   test('runs an exec action and fills in default environment variables and arguments', async () => {
  //     const formatExec = new FormatExec('fake_docker_id', new Microservice({
  //       omg: 1,
  //       actions: {
  //         steve: {
  //           format: {
  //             command: 'steve.sh',
  //           },
  //           output: {type: 'string'},
  //           arguments: {
  //             foo: {
  //               type: 'int',
  //               default: 3,
  //             },
  //             bar: {
  //               type: 'map',
  //               default: {
  //                 foo: 'bar',
  //               },
  //             },
  //           },
  //         },
  //       },
  //       environment: {
  //         BOB_TOKEN: {
  //           type: 'string',
  //           default: 'BOBBY',
  //         },
  //       },
  //     }), {}, {});
  //     await formatExec.startService();

  //     await formatExec.exec('steve');
  //     expect(execStub.args).toEqual([
  //       ['docker run -td -e BOB_TOKEN="BOBBY" --entrypoint tail fake_docker_id -f /dev/null'],
  //       ['docker exec `execStub` steve.sh \'{"foo":3,"bar":{"foo":"bar"}}\''],
  //     ]);
  //   });
  });

  // describe('.stopService()', () => {
  //   test('stops the service', async () => {
  //     const formatExec = new FormatExec('fake_docker_id', new Microservice({
  //       omg: 1,
  //       actions: {
  //         test: {
  //           format: {
  //             command: 'test.sh',
  //           },
  //           output: {type: 'string'},
  //         },
  //       },
  //     }), {}, {});
  //     await formatExec.startService();
  //     await formatExec.exec('test');

  //     await formatExec.stopService();
  //     expect(execStub.args).toEqual([
  //       ['docker run -td --entrypoint tail fake_docker_id -f /dev/null'],
  //       ['docker exec `execStub` test.sh'],
  //       ['docker kill `execStub`'],
  //     ]);
  //   });
  // });
});
