// Tests for EduTrack. No framework: CHECK prints a failure and the exit code says whether anything failed.
//   g++ -std=c++17 -Wall -Wextra -o tests tests.cpp && ./tests
#include <cmath>
#include <cstdio>
#include <iostream>

#include "registry.hpp"

using namespace edutrack;

static int failures = 0;
static int checks = 0;

#define CHECK(condition)                                                          \
    do {                                                                          \
        ++checks;                                                                 \
        if (!(condition)) {                                                       \
            ++failures;                                                           \
            std::cout << "FAIL line " << __LINE__ << ": " << #condition << '\n'; \
        }                                                                         \
    } while (0)

template <typename F>
static bool throwsValidation(F f) {
    try {
        f();
    } catch (const ValidationError&) {
        return true;
    }
    return false;
}

static void testGradePoints() {
    CHECK(gradePoints(100) == 4.0);
    CHECK(gradePoints(85) == 4.0);
    CHECK(gradePoints(84.9) == 3.67);
    CHECK(gradePoints(50) == 1.0);
    CHECK(gradePoints(49.9) == 0.0);
}

static void testGpaIsWeightedByCredits() {
    Student s("S-1001", "Ayesha Khan");
    CHECK(s.gpa() == 0.0);  // no results yet
    s.addResult("CS101", 3, 90);  // 4.00 x 3
    s.addResult("MA101", 1, 50);  // 1.00 x 1
    CHECK(std::abs(s.gpa() - (4.0 * 3 + 1.0 * 1) / 4) < 1e-9);
}

static void testValidation() {
    CHECK(throwsValidation([] { Student("1001", "Ayesha"); }));
    CHECK(throwsValidation([] { Student("F-1001", "Ayesha"); }));  // wrong prefix for a student
    CHECK(throwsValidation([] { Student("S-1001", " "); }));
    CHECK(throwsValidation([] { Student("S-1001", "A|B"); }));
    Student s("S-1001", "Ayesha Khan");
    CHECK(throwsValidation([&] { s.addResult("cs101", 3, 80); }));
    CHECK(throwsValidation([&] { s.addResult("CS101", 0, 80); }));
    CHECK(throwsValidation([&] { s.addResult("CS101", 3, 101); }));
    CHECK(throwsValidation([&] { s.addResult("CS101", 3, -1); }));
    s.addResult("CS101", 3, 80);
    CHECK(throwsValidation([&] { s.addResult("CS101", 3, 90); }));  // duplicate course
    CHECK(s.results().size() == 1);                                  // rejected input changed nothing
}

static void testPolymorphism() {
    std::vector<std::unique_ptr<Person>> people;
    people.push_back(std::make_unique<Student>("S-1001", "Ayesha Khan"));
    people.push_back(std::make_unique<Faculty>("F-2001", "Dr. Sana Malik", "Computer Science"));
    CHECK(people[0]->role() == "Student");
    CHECK(people[1]->role() == "Faculty");
    CHECK(people[1]->summary().find("Computer Science") != std::string::npos);
}

static void testRegistryRejectsDuplicateIds() {
    Registry r;
    r.add(std::make_unique<Student>("S-1001", "Ayesha Khan"));
    CHECK(throwsValidation([&] { r.add(std::make_unique<Student>("S-1001", "Other")); }));
    CHECK(r.findStudent("S-1001") != nullptr);
    CHECK(r.findFaculty("S-1001") == nullptr);  // right id, wrong kind
    CHECK(r.find("S-9999") == nullptr);
}

static void testSaveAndLoadRoundTrip() {
    Registry r;
    r.add(std::make_unique<Student>("S-1001", "Ayesha Khan"));
    r.findStudent("S-1001")->addResult("CS101", 3, 88.5);
    r.findStudent("S-1001")->addResult("MA101", 3, 72);
    r.add(std::make_unique<Faculty>("F-2001", "Dr. Sana Malik", "Computer Science"));
    r.findFaculty("F-2001")->teach("CS101");
    r.save("roundtrip.dat");

    Registry again;
    const LoadReport report = again.load("roundtrip.dat");
    CHECK(report.loaded == 2);
    CHECK(report.problems.empty());
    CHECK(again.findStudent("S-1001")->results().size() == 2);
    CHECK(std::abs(again.findStudent("S-1001")->gpa() - r.findStudent("S-1001")->gpa()) < 1e-9);
    CHECK(again.findFaculty("F-2001")->courses().size() == 1);
    std::remove("roundtrip.dat");
}

static void testLoadSkipsDamagedLines() {
    {
        std::ofstream f("damaged.dat");
        f << "S|S-1001|Ayesha Khan|CS101:3:88.5\n";
        f << "S|S-1002|Bilal|CS101:3:250\n";      // marks out of range
        f << "garbage line\n";                      // not a record
        f << "S|S-1003|Hira|CS101:three:80\n";     // credits are not a number
        f << "\n";                                  // blank lines are ignored
        f << "F|F-2001|Dr. Sana Malik|Computer Science|CS101\n";
    }
    Registry r;
    const LoadReport report = r.load("damaged.dat");
    CHECK(report.loaded == 2);
    CHECK(report.problems.size() == 3);
    CHECK(!report.problems.empty() && report.problems[0].rfind("line 2:", 0) == 0);
    CHECK(r.people().size() == 2);
    std::remove("damaged.dat");
}

static void testLoadMissingFile() {
    Registry r;
    bool threw = false;
    try {
        r.load("does-not-exist.dat");
    } catch (const std::runtime_error&) {
        threw = true;
    }
    CHECK(threw);
}

int main() {
    testGradePoints();
    testGpaIsWeightedByCredits();
    testValidation();
    testPolymorphism();
    testRegistryRejectsDuplicateIds();
    testSaveAndLoadRoundTrip();
    testLoadSkipsDamagedLines();
    testLoadMissingFile();
    std::cout << (checks - failures) << " of " << checks << " checks passed\n";
    return failures == 0 ? 0 : 1;
}
