module.exports = protect;

var Promise = require('es6-promise').Promise; // jshint ignore:line

var debug = require('debug')('snyk');
var snyk = require('../../lib/');
var protect = require('../../lib/protect');
var inquirer = require('inquirer');
var path = require('path');
var fs = require('then-fs');
var _ = require('lodash');

function protect(options) {
  if (!options) {
    options = {};
  }

  if (options['dry-run']) {
    debug('*** dry run ****');
  } else {
    debug('~~~~ LIVE RUN ~~~~');
  }

  return snyk.dotfile.load().then(function (config) {
    if (options.interactive) {
      return interactive(config, options);
    }

    // FIXME should patch
    if (config.patch) {
      return 'patch not available in beta';
    }
    return 'nothing to do';
  }).catch(function (error) {
    if (error.code === 'ENOENT') {
      error.code = 'MISSING_DOTFILE';
    }

    throw error;
  });
}

function interactive(config, options) {
  var cwd = process.cwd();
  return snyk.test(cwd).then(function (res) {
    if (res.ok) {
      return 'Nothing to be done. Well done, you.';
    }

    // `install` will give us what to uninstall and which specific version to
    // newly install. within the .reduce loop, we'll also capture the list
    // of packages (in `patch`)  that we need to apply patch files to, to avoid
    // the vuln
    var actions = [{
      value: 'skip',
      key: 'n',
      name: 'Do nothing',
    }, {
      value: 'ignore',
      key: 'i',
      name: 'Ignore it for 30 days',
    }, ];

    var patchAction = {
      value: 'patch',
      key: 'p',
      name: 'Patch',
    };

    var updateAction = {
      value: 'update',
      key: 'u',
      name: '<updated-in-code>',
    };

    var prompts = res.vulnerabilities.map(function (vuln, i) {
      var id = vuln.id || ('node-' + vuln.name + '@' + vuln.below);

      id += '-' + i;

      var choices = _.cloneDeep(actions);
      var patch = _.cloneDeep(patchAction);
      var update = _.cloneDeep(updateAction);

      var from = vuln.from.slice(1).filter(Boolean).shift();

      var res = {
        name: id,
        type: 'expand',
        message: 'Fix vulnerability in ' + from +
          '\n  - from: ' + vuln.from.join(' > '),
      };

      choices.unshift(patch);
      if (vuln.upgradePath.some(function (pkg, i) {
        // if the upgade path is to upgrade the module to the same range the
        // user already asked for, then it means we need to just blow that
        // module away and re-install
        if (pkg && vuln.from.length > i && pkg === vuln.from[i]) {
          return true;
        }

        // if the upgradePath contains the first two elements, that is
        // the project itself (i.e. jsbin) then the direct dependency can be
        // upgraded. Note that if the first two elements
        if (vuln.upgradePath.slice(0, 2).filter(Boolean).length) {
          return true;
        }
      })) {
        choices.unshift(update);
        update.name = 'Update to ' + vuln.upgradePath.filter(Boolean).shift();
      }

      // kludge to make sure that we get the vuln in the user selection
      res.choices = choices.map(function (choice) {
        var value = choice.value;
        choice.value = {
          vuln: vuln,
          choice: value,
        };
        return choice;
      });

      return res;
    });

    prompts = prompts.reduce(function (acc, curr) {
      acc.push(curr);
      acc.push({
        name: curr.name + '-reason',
        message: '[audit] Reason for ignoring vulnerability?',
        default: 'None given',
        when: function (answers) {
          return answers[curr.name].choice === 'ignore';
        },
      });
      return acc;
    }, []);

    debug('starting questions');

    return new Promise(function (resolve) {
      inquirer.prompt(prompts, function (answers) {
        var tasks = {
          ignore: [],
          update: [],
          patch: [],
          skip: [],
        };

        Object.keys(answers).forEach(function (key) {
          // if we're looking at a reason, skip it
          if (key.indexOf('-reason') !== -1) {
            return;
          }

          var answer = answers[key];
          var task = answer.choice;

          if (task === 'ignore') {
            answer.vuln.reason = answers[key + '-reason'];
          }

          tasks[task].push(answer.vuln);
        });

        debug(tasks.patch);

        var promises = [
          protect.ignore(tasks.ignore, !options['dry-run']),
          protect.update(tasks.update, !options['dry-run']),
          protect.patch(tasks.patch, !options['dry-run']),
        ];

        var promise = Promise.all(promises).then(function (res) {
          // we're squashing the arrays of arrays into a flat structure
          // with only non-false values
          var results = _.flattenDeep(res).filter(Boolean);

          // then we merge the configs together using the original config
          // as the baseline (this lets us retain the user's existing config)
          results.unshift(config);
          var newConfig = _.merge.apply(_, results);

          debug(JSON.stringify(newConfig, '', 2));

          if (!options['dry-run']) {
            var packageFile = path.resolve(cwd, 'package.json');
            debug('updating %s', packageFile);
            return snyk.dotfile.save(newConfig)
              .then(function () {
                return fs.readFile(packageFile, 'utf8');
              })
              .then(function (src) {
                var data = JSON.parse(src);
                // finally save to the package.json
                if (!data.scripts) {
                  data.scripts = {};
                }

                data.scripts['snyk-protect'] = 'snyk protect';

                var cmd = 'npm run snyk-protect';
                if (data.scripts['post-install']) {
                  // only add the post-install if it's not in the post-install
                  // already
                  if (data.scripts['post-install'].indexOf(cmd) === -1) {
                    data.scripts['post-install'] = cmd + ' && ' +
                      data.scripts['post-install'];
                  }
                } else {
                  data.scripts['post-install'] = cmd;
                }

                data.snyk = true;

                return JSON.stringify(data, '', 2);
              })
              .then(fs.writeFile.bind(null, packageFile))
              .then(function () {
                return '.snyk file saved and package.json updated with ' +
                  'protect.';
              });
          }
          return 'This was a dry run: nothing changed';
        });

        resolve(promise);
      });
    });

  });

}
