import argparse
import json
import operator
from unicodedata import normalize
from collections import Counter

from typing import List, Tuple


def strip_accents(text: str) -> str:
    return normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')


def parse_file(filename: str) -> List[List[str]]:
    with open(filename) as fp:
        return [strip_accents(line).split() for line in fp]


def count(full_names: List[List[str]]) -> Tuple[Counter, Counter]:
    totals = Counter(' '.join(n) for n in full_names)
    print(totals.most_common(15))

    single_given_names = Counter(name[0] for name in full_names)

    given_names_counter, family_names_counter = Counter(), Counter()
    for full_name in full_names:
        name, *surnames = full_name
        if single_given_names[surnames[0]] > 0.02 * single_given_names[name]:
            name, surnames = f'{name} {surnames[0]}', surnames[1:]

        given_names_counter[name] += 1
        family_names_counter.update(set(surnames))

    for ignored in {'DA', 'DE', 'DO', 'DOS'}:
        del family_names_counter[ignored]
    return given_names_counter, family_names_counter


def to_index(values) -> List[Tuple]:
    return sorted(((k.lower(), v) for k, v in values.items()),
                  key=operator.itemgetter(1), reverse=True)


def write_file(filename: str, names: Counter, surnames: Counter):
    dump = {'names': to_index(names), 'surnames': to_index(surnames)}

    with open(filename, 'w') as fp:
        json.dump(dump, fp)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('output')
    args = parser.parse_args()

    full_names = parse_file(args.input)
    names, surnames = count(full_names)
    write_file(args.output, names, surnames)


if __name__ == '__main__':
    main()
