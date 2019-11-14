// Meta-Grammar parser

/* 
 * GRAM      := head=RULEDEF tail=GRAM
 *            | def=RULEDEF;
 * RULEDEF   := _ name=NAME '\s*:=\s*' rule=RULE '\s*;';
 * RULE      := head=ALT '\s*\|\s*' tail=RULE
 *            | alt=ALT;
 * ALT       := head=MATCSPEC _ tail=ALT
 *            | mtch=MATCHSPEC;
 * MATCHSPEC := name=NAME '=' rule=ATOM
 *            | rule=ATOM;
 * ATOM      := name=NAME
 *            | match=STRLIT;
 * NAME      := val='[a-zA-Z_]+';
 * STRLIT    := val='\'([^\'\\]|(\\.))*\'';
 * _         := '\s*';
 */

type Nullable<T> = T | null;

type $$RuleType<T> = (log? : (msg : string) => void) => Nullable<T>;

interface Visitable {
    accept<T>(visitor : Visitor<T>) : T;
}

export interface ContextRecorder {
    record(pos: number, result: Nullable<ASTNode>, extraInfo : string[]) : void;
}

interface ASTNodeIntf {
    kind: ASTKinds;
}

export class $$StrMatch implements ASTNodeIntf {
    kind: ASTKinds.$$StrMatch = ASTKinds.$$StrMatch;
    match : string;
    constructor(val : string){
        this.match = val;
    }
}

export enum ASTKinds {
  $$StrMatch,
  GRAM_1,
  GRAM_2,
  RULEDEF,
  RULE_1,
  RULE_2,
  ALT_1,
  ALT_2,
  MATCHSPEC_1,
  MATCHSPEC_2,
  ATOM_1,
  ATOM_2,
  NAME,
  STRLIT,
  _
}
export type ASTNode = $$StrMatch | GRAM | RULEDEF | RULE | ALT | MATCHSPEC | ATOM | NAME | STRLIT | _;
export type GRAM = GRAM_1 | GRAM_2;
export class GRAM_1 implements ASTNodeIntf {
    kind : ASTKinds.GRAM_1 = ASTKinds.GRAM_1;
    head : RULEDEF;
    tail : GRAM;
    constructor(head : RULEDEF,tail : GRAM){
        this.head = head;
        this.tail = tail;
    }
}
export class GRAM_2 implements ASTNodeIntf {
    kind : ASTKinds.GRAM_2 = ASTKinds.GRAM_2;
    def : RULEDEF;
    constructor(def : RULEDEF){
        this.def = def;
    }
}

export class RULEDEF implements ASTNodeIntf {
    kind : ASTKinds.RULEDEF = ASTKinds.RULEDEF;
    name : NAME;
    rule : RULE;
    constructor(name : NAME,rule : RULE){
        this.name = name;
        this.rule = rule;
    }
}
export type RULE = RULE_1 | RULE_2;
export class RULE_1 implements ASTNodeIntf {
    kind : ASTKinds.RULE_1 = ASTKinds.RULE_1;
    head : ALT;
    tail : RULE;
    constructor(head : ALT,tail : RULE){
        this.head = head;
        this.tail = tail;
    }
}
export class RULE_2 implements ASTNodeIntf {
    kind : ASTKinds.RULE_2 = ASTKinds.RULE_2;
    alt : ALT;
    constructor(alt : ALT){
        this.alt = alt;
    }
}
export type ALT = ALT_1 | ALT_2;
export class ALT_1 implements ASTNodeIntf {
    kind : ASTKinds.ALT_1 = ASTKinds.ALT_1;
    head : MATCHSPEC;
    tail : ALT;
    constructor(head : MATCHSPEC,tail : ALT){
        this.head = head;
        this.tail = tail;
    }
}
export class ALT_2 implements ASTNodeIntf {
    kind : ASTKinds.ALT_2 = ASTKinds.ALT_2;
    mtch : MATCHSPEC;
    constructor(mtch : MATCHSPEC){
        this.mtch = mtch;
    }
}
export type MATCHSPEC = MATCHSPEC_1 | MATCHSPEC_2;
export class MATCHSPEC_1 implements ASTNodeIntf {
    kind : ASTKinds.MATCHSPEC_1 = ASTKinds.MATCHSPEC_1;
    name : NAME;
    rule : ATOM;
    constructor(name : NAME,rule : ATOM){
        this.name = name;
        this.rule = rule;
    }
}
export class MATCHSPEC_2 implements ASTNodeIntf {
    kind : ASTKinds.MATCHSPEC_2 = ASTKinds.MATCHSPEC_2;
    rule : ATOM;
    constructor(rule : ATOM){
        this.rule = rule;
    }
}
export type ATOM = ATOM_1 | ATOM_2;
export class ATOM_1 implements ASTNodeIntf {
    kind : ASTKinds.ATOM_1 = ASTKinds.ATOM_1;
    name : NAME;
    constructor(name : NAME){
        this.name = name;
    }
}
export class ATOM_2 implements ASTNodeIntf {
    kind : ASTKinds.ATOM_2 = ASTKinds.ATOM_2;
    match : STRLIT;
    constructor(match : STRLIT){
        this.match = match;
    }
}

export class NAME implements ASTNodeIntf {
    kind : ASTKinds.NAME = ASTKinds.NAME;
    val : $$StrMatch;
    constructor(val : $$StrMatch){
        this.val = val;
    }
}

export class STRLIT implements ASTNodeIntf {
    kind : ASTKinds.STRLIT = ASTKinds.STRLIT;
    val : $$StrMatch;
    constructor(val : $$StrMatch){
        this.val = val;
    }
}

export class _ implements ASTNodeIntf {
    kind : ASTKinds._ = ASTKinds._;

    constructor(){

    }
}

function tst(at : ASTNode){
    if(at.kind === ASTKinds.$$StrMatch)
        console.log(at.match);
}

export class Parser {
    private pos : number = 0;
    readonly input : string;
    constructor(input : string) {
        this.input = input;
    }

    private mark() : number {
        return this.pos;
    }

    reset(pos : number) {
        this.pos = pos;
    }

    finished() : boolean {
        return this.pos == this.input.length;
    }

    private loop<T>(func : $$RuleType<T>, star : boolean = false) : $$RuleType<T[]> {
        return ()=> {
            const mrk = this.mark();
            let res : T[] = [];
            for(;;) {
                const t = func();
                if(!t)
                    break;
                res.push(t);
            }
            if(star || res.length > 0)
                return res;
            this.reset(mrk);
            return null;
        };
    }

    private runner<T extends ASTNode>(fn : $$RuleType<T>,
        cr? : ContextRecorder) : $$RuleType<T> {
        return () => {
            const mrk = this.mark();
            const res = cr ? (()=>{
                let extraInfo : string[] = [];
                const res = fn((msg : string) => extraInfo.push(msg));
                cr.record(mrk, res, extraInfo);
                return res;
            })() : fn();
            if(res)
                return res;
            this.reset(mrk);
            return null
        }
    }

    private choice<T>(fns : $$RuleType<T>[]) : Nullable<T> {
        for(let f of fns){
            const res = f();
            if(res)
                return res;
        }
        return null;
    }

    private regexAccept(match : string, cr? : ContextRecorder) : Nullable<$$StrMatch> {
        return this.runner<$$StrMatch>(
            (log) => {
                if(log)
                    log(match);
                var reg = new RegExp(match, 'y');
                reg.lastIndex = this.mark();
                const res = reg.exec(this.input);
                if(res){
                    this.pos = reg.lastIndex;
                    return new $$StrMatch(res[0]);
                }
                return null;
            }, cr)();
    }

matchGRAM(cr? : ContextRecorder) : Nullable<GRAM> {
        return this.choice<GRAM>([
                () => { return this.matchGRAM_1(cr) },
                () => { return this.matchGRAM_2(cr) }
        ]);
}
matchGRAM_1(cr? : ContextRecorder) : Nullable<GRAM_1> {
    return this.runner<GRAM_1>(
        () => {
            let head : Nullable<RULEDEF>;
            let tail : Nullable<GRAM>;
            let res : Nullable<GRAM_1> = null;
            if(true
                && (head = this.matchRULEDEF(cr))
                && (tail = this.matchGRAM(cr))
            )
                res = new GRAM_1(head, tail);
            return res;
        },
        cr)();
}
matchGRAM_2(cr? : ContextRecorder) : Nullable<GRAM_2> {
    return this.runner<GRAM_2>(
        () => {
            let def : Nullable<RULEDEF>;
            let res : Nullable<GRAM_2> = null;
            if(true
                && (def = this.matchRULEDEF(cr))
            )
                res = new GRAM_2(def);
            return res;
        },
        cr)();
}
matchRULEDEF(cr? : ContextRecorder) : Nullable<RULEDEF> {
    return this.runner<RULEDEF>(
        () => {
            let name : Nullable<NAME>;
            let rule : Nullable<RULE>;
            let res : Nullable<RULEDEF> = null;
            if(true
                && this.match_(cr)
                && (name = this.matchNAME(cr))
                && this.regexAccept(String.raw`\s*:=\s*`, cr)
                && (rule = this.matchRULE(cr))
                && this.regexAccept(String.raw`\s*;\s*`, cr)
            )
                res = new RULEDEF(name, rule);
            return res;
        },
        cr)();
}
matchRULE(cr? : ContextRecorder) : Nullable<RULE> {
        return this.choice<RULE>([
                () => { return this.matchRULE_1(cr) },
                () => { return this.matchRULE_2(cr) }
        ]);
}
matchRULE_1(cr? : ContextRecorder) : Nullable<RULE_1> {
    return this.runner<RULE_1>(
        () => {
            let head : Nullable<ALT>;
            let tail : Nullable<RULE>;
            let res : Nullable<RULE_1> = null;
            if(true
                && (head = this.matchALT(cr))
                && this.regexAccept(String.raw`\s*\|\s*`, cr)
                && (tail = this.matchRULE(cr))
            )
                res = new RULE_1(head, tail);
            return res;
        },
        cr)();
}
matchRULE_2(cr? : ContextRecorder) : Nullable<RULE_2> {
    return this.runner<RULE_2>(
        () => {
            let alt : Nullable<ALT>;
            let res : Nullable<RULE_2> = null;
            if(true
                && (alt = this.matchALT(cr))
            )
                res = new RULE_2(alt);
            return res;
        },
        cr)();
}
matchALT(cr? : ContextRecorder) : Nullable<ALT> {
        return this.choice<ALT>([
                () => { return this.matchALT_1(cr) },
                () => { return this.matchALT_2(cr) }
        ]);
}
matchALT_1(cr? : ContextRecorder) : Nullable<ALT_1> {
    return this.runner<ALT_1>(
        () => {
            let head : Nullable<MATCHSPEC>;
            let tail : Nullable<ALT>;
            let res : Nullable<ALT_1> = null;
            if(true
                && (head = this.matchMATCHSPEC(cr))
                && this.match_(cr)
                && (tail = this.matchALT(cr))
            )
                res = new ALT_1(head, tail);
            return res;
        },
        cr)();
}
matchALT_2(cr? : ContextRecorder) : Nullable<ALT_2> {
    return this.runner<ALT_2>(
        () => {
            let mtch : Nullable<MATCHSPEC>;
            let res : Nullable<ALT_2> = null;
            if(true
                && (mtch = this.matchMATCHSPEC(cr))
            )
                res = new ALT_2(mtch);
            return res;
        },
        cr)();
}
matchMATCHSPEC(cr? : ContextRecorder) : Nullable<MATCHSPEC> {
        return this.choice<MATCHSPEC>([
                () => { return this.matchMATCHSPEC_1(cr) },
                () => { return this.matchMATCHSPEC_2(cr) }
        ]);
}
matchMATCHSPEC_1(cr? : ContextRecorder) : Nullable<MATCHSPEC_1> {
    return this.runner<MATCHSPEC_1>(
        () => {
            let name : Nullable<NAME>;
            let rule : Nullable<ATOM>;
            let res : Nullable<MATCHSPEC_1> = null;
            if(true
                && (name = this.matchNAME(cr))
                && this.regexAccept(String.raw`=`, cr)
                && (rule = this.matchATOM(cr))
            )
                res = new MATCHSPEC_1(name, rule);
            return res;
        },
        cr)();
}
matchMATCHSPEC_2(cr? : ContextRecorder) : Nullable<MATCHSPEC_2> {
    return this.runner<MATCHSPEC_2>(
        () => {
            let rule : Nullable<ATOM>;
            let res : Nullable<MATCHSPEC_2> = null;
            if(true
                && (rule = this.matchATOM(cr))
            )
                res = new MATCHSPEC_2(rule);
            return res;
        },
        cr)();
}
matchATOM(cr? : ContextRecorder) : Nullable<ATOM> {
        return this.choice<ATOM>([
                () => { return this.matchATOM_1(cr) },
                () => { return this.matchATOM_2(cr) }
        ]);
}
matchATOM_1(cr? : ContextRecorder) : Nullable<ATOM_1> {
    return this.runner<ATOM_1>(
        () => {
            let name : Nullable<NAME>;
            let res : Nullable<ATOM_1> = null;
            if(true
                && (name = this.matchNAME(cr))
            )
                res = new ATOM_1(name);
            return res;
        },
        cr)();
}
matchATOM_2(cr? : ContextRecorder) : Nullable<ATOM_2> {
    return this.runner<ATOM_2>(
        () => {
            let match : Nullable<STRLIT>;
            let res : Nullable<ATOM_2> = null;
            if(true
                && (match = this.matchSTRLIT(cr))
            )
                res = new ATOM_2(match);
            return res;
        },
        cr)();
}
matchNAME(cr? : ContextRecorder) : Nullable<NAME> {
    return this.runner<NAME>(
        () => {
            let val : Nullable<$$StrMatch>;
            let res : Nullable<NAME> = null;
            if(true
                && (val = this.regexAccept(String.raw`[a-zA-Z_]+`, cr))
            )
                res = new NAME(val);
            return res;
        },
        cr)();
}
matchSTRLIT(cr? : ContextRecorder) : Nullable<STRLIT> {
    return this.runner<STRLIT>(
        () => {
            let val : Nullable<$$StrMatch>;
            let res : Nullable<STRLIT> = null;
            if(true
                && this.regexAccept(String.raw`\'`, cr)
                && (val = this.regexAccept(String.raw`([^\'\\]|(\\.))*`, cr))
                && this.regexAccept(String.raw`\'`, cr)
            )
                res = new STRLIT(val);
            return res;
        },
        cr)();
}
match_(cr? : ContextRecorder) : Nullable<_> {
    return this.runner<_>(
        () => {

            let res : Nullable<_> = null;
            if(true
                && this.regexAccept(String.raw`\s*`, cr)
            )
                res = new _();
            return res;
        },
        cr)();

}

    parse() : ParseResult {
        const mrk = this.mark();
        const res = this.matchGRAM();
        if(res && this.finished())
            return new ParseResult(res, null);
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.matchGRAM(rec);
        return new ParseResult(res, rec.getErr());
    }
}

export interface Visitor<T> {
    visitGRAM(gram : GRAM) : T;
    visitRULEDEF(ruledef : RULEDEF) : T;
    visitRULE(rule : RULE) : T;
    visitALT(rule : ALT) : T;
    visitMATCHSPEC(matchspec : MATCHSPEC) : T;
    visitATOM(atom : ATOM) : T;
    visitNAME(strlit : NAME) : T;
    visitSTRLIT(strlit : STRLIT) : T;
    visit_(_ : _) : T;
}

export class ParseResult {
    ast : Nullable<GRAM>;
    err : Nullable<SyntaxErr>;
    constructor(ast : Nullable<GRAM>, err : Nullable<SyntaxErr>){
        this.ast = ast;
        this.err = err;
    }
}

export class SyntaxErr {
    pos : number;
    exp : string[];
    constructor(pos : number, exp : Set<string>){
        this.pos = pos;
        this.exp = [...exp];
    }

    toString() : string {
        return `Syntax Error at position ${this.pos}, expected one of ${this.exp.map(x => ` '${x}'`)}`;
    }
}

class ErrorTracker implements ContextRecorder {
    mxd : number | undefined;
    pmatches: Set<string> = new Set();

    record(pos : number, result : Nullable<ASTNode>, extraInfo : string[]){
        if(result === null) {
            if(this.mxd && this.mxd > pos)
                return;
            if(!this.mxd || this.mxd < pos){
                this.mxd = pos;
                this.pmatches = new Set();
            }
            extraInfo.forEach(x => this.pmatches.add(x));
        }
    }

    getErr() : SyntaxErr | null {
        if(this.mxd)
            return new SyntaxErr(this.mxd, this.pmatches);
        return null;
    }
}
