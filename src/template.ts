import { Block } from './util';
export function expandTemplate(input: string, kinds : Block, ruleClasses : Block, ruleParseFns : Block,
    parseResult : Block) : Block{ 
        return [
    '/* AutoGenerated Code, changes may be overwritten',
    '* INPUT GRAMMAR:',
    ...input.split(/\r?\n/).filter(x => x!='').map(x => '* ' + x),
    '*/',
    'type Nullable<T> = T | null;',
    'type $$RuleType<T> = (log? : (msg : string) => void) => Nullable<T>;',
    'export interface ContextRecorder {',
    [
        'record(pos: PosInfo, depth : number, result: any, extraInfo : string[]) : void;'
    ],
    '}',
    'interface ASTNodeIntf {',
    [
        'kind: ASTKinds;',
    ],
    '}',
    ...kinds,
    ...ruleClasses,
    'export class Parser {',
    [
        'private pos : PosInfo;',
        'readonly input : string;',
        'constructor(input : string) {',
        [
            'this.pos = new PosInfo(0, 1, 0);',
            'this.input = input;'
        ],
        '}',
        'private mark() : PosInfo {',
        [
            'return this.pos;'
        ],
        '}',
        'reset(pos : PosInfo) {',
        [
            'this.pos = pos;',
        ],
        '}',
        'finished() : boolean {',
        [
            'return this.pos.overall_pos === this.input.length;'
        ],
        '}',
        'private loop<T>(func : $$RuleType<T>, star : boolean = false) : Nullable<T[]> {',
        [
            'const mrk = this.mark();',
            'let res : T[] = [];',
            'for(;;) {',
            [
                'const t = func();',
                'if(!t)',
                [
                    'break;'
                ],
                'res.push(t);',
            ],
            '}',
            'if(star || res.length > 0)',
            [
                'return res;'
            ],
            'this.reset(mrk);',
            'return null;'
        ],
        '}',
        'private runner<T>($$dpth : number, fn : $$RuleType<T>,',
        [
            'cr? : ContextRecorder) : $$RuleType<T> {',
            'return () => {',
            [
                'const mrk = this.mark();',
                'const res = cr ? (()=>{',
                [
                    'let extraInfo : string[] = [];',
                    'const res = fn((msg : string) => extraInfo.push(msg));',
                    'cr.record(mrk, $$dpth, res, extraInfo);',
                    'return res;'
                ],
                '})() : fn();',
                'if(res !== null)',
                [
                    'return res;'
                ],
                'this.reset(mrk);',
                'return null',
            ],
            '}'
        ],
        '}',

        'private choice<T>(fns : $$RuleType<T>[]) : Nullable<T> {',
        [
            'for(let f of fns){',
            [
                'const res = f();',
                'if(res)',
                [
                    'return res;'
                ],
            ],
            '}',
            'return null;'
        ],
        '}',
        'private regexAccept(match : string, dpth : number, cr? : ContextRecorder) : Nullable<string> {',
        [
            'return this.runner<string>(dpth,',
            [
                '(log) => {',
                [
                    'if(log){',
                    [
                        'log(\'$$StrMatch\');',
                        'log(match);'
                    ],
                    '}',
                    'var reg = new RegExp(match, \'y\');',
                    'reg.lastIndex = this.mark().overall_pos;',
                    'const res = reg.exec(this.input);',
                    'if(res){',
                    [
                        'let lineJmp = 0;',
                        'let lind = -1;',
                        'for(let i = 0; i < res[0].length; ++i){',
                        [
                            'if(res[0][i] === \'\\n\'){',
                            [
                                '++lineJmp;',
                                'lind = i;',
                            ],
                            '}',
                        ],
                        '}',
                        'this.pos = new PosInfo(reg.lastIndex, this.pos.line + lineJmp, lind === -1 ? this.pos.offset + res[0].length: (res[0].length - lind));',
                        'return res[0];'
                    ],
                    '}',
                    'return null;'
                ],
                '}, cr)();'
            ]
        ],
        '}',
        'private noConsume<T>($$dpth : number, fn : $$RuleType<T>, cr? : ContextRecorder) : Nullable<T> {',
        [
            'const mrk = this.mark();',
            'const res = fn();',
            'this.reset(mrk);',
            'return res;',
        ],
        '}',
        ...ruleParseFns,
    ],
    '}',

    ...parseResult,

    'export class PosInfo {',
    [
        'overall_pos : number;',
        'line : number;',
        'offset : number;',
        'constructor(overall_pos : number, line : number, offset : number) {',
        [
            'this.overall_pos = overall_pos;',
            'this.line = line;',
            'this.offset = offset;',
        ],
        '}',
    ],
    '}',
    'export class SyntaxErr {',
    [
        'pos : PosInfo;',
        'exprules : string[];',
        'expmatches : string[]',
        'constructor(pos : PosInfo, exprules : Set<string>, expmatches : Set<string>){',
        [
            'this.pos = pos;',
            'this.exprules = [...exprules];',
            'this.expmatches = [...expmatches];',
        ],
        '}',
        'toString() : string {',
        [
            'return `Syntax Error at line ${this.pos.line}:${this.pos.offset}. Tried to match rules ${this.exprules.join(\', \')}. Expected one of ${this.expmatches.map(x => ` \'${x}\'`)}`;'
        ],
        '}',
    ],
    '}',
    'class ErrorTracker implements ContextRecorder {',
    [
        'mxpos : PosInfo = new PosInfo(-1, -1, -1)',
        'mnd : number = -1;',
        'prules : Set<string> = new Set();',
        'pmatches: Set<string> = new Set();',
        'record(pos : PosInfo, depth : number, result : any, extraInfo : string[]){',
        [
            'if(result !== null)',
            [
                'return;',
            ],
            'if(pos.overall_pos > this.mxpos.overall_pos){',
            [
                'this.mxpos = pos;',
                'this.mnd = depth;',
                'this.pmatches.clear();',
                'this.prules.clear();',
            ],
            '} else if(pos.overall_pos === this.mxpos.overall_pos && depth < this.mnd){',
            [
                'this.mnd = depth;',
                'this.prules.clear();',
            ],
            '}',
            'if(this.mxpos.overall_pos === pos.overall_pos && extraInfo.length >= 2 && extraInfo[0] === \'$$StrMatch\')',
            [
                'this.pmatches.add(extraInfo[1]);',
            ],
            'if(this.mxpos.overall_pos === pos.overall_pos && this.mnd === depth)',
            [
                'extraInfo.forEach(x => { if(x !== \'$$StrMatch\') this.prules.add(x)});',
            ],
        ],
        '}',
        'getErr() : SyntaxErr | null {',
        [
            'if(this.mxpos.overall_pos !== -1)',
            [
                'return new SyntaxErr(this.mxpos, this.prules, this.pmatches);',
            ],
            'return null;',
        ],
        '}',
    ],
    '}',
];
}
