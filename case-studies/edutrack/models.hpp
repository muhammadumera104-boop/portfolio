// EduTrack: the data model.
//
// Person is an abstract base class. Student and Faculty inherit from it and answer the same questions
// (role, summary, serialize) in their own way: that is polymorphism. Everything that goes wrong with bad input
// is reported by throwing ValidationError, so the menu can show a message and ask again instead of crashing.
#pragma once

#include <algorithm>
#include <cctype>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace edutrack {

struct ValidationError : std::runtime_error {
    using std::runtime_error::runtime_error;
};

// ---- small validation helpers -------------------------------------------------------------------

inline std::string trim(const std::string& text) {
    const auto first = text.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    const auto last = text.find_last_not_of(" \t\r\n");
    return text.substr(first, last - first + 1);
}

// '|' and ';' separate fields in the data file, so they cannot be part of a name.
inline std::string validName(const std::string& raw) {
    const std::string name = trim(raw);
    if (name.size() < 2 || name.size() > 60) throw ValidationError("Name must be 2 to 60 characters.");
    if (name.find_first_of("|;") != std::string::npos) throw ValidationError("Name cannot contain '|' or ';'.");
    return name;
}

// An id is one letter, a dash and four digits: S-1001 for students, F-2001 for faculty.
inline std::string validId(const std::string& raw, char prefix) {
    const std::string id = trim(raw);
    bool ok = id.size() == 6 && id[0] == prefix && id[1] == '-';
    for (std::size_t i = 2; ok && i < id.size(); ++i) ok = std::isdigit(static_cast<unsigned char>(id[i])) != 0;
    if (!ok) throw ValidationError(std::string("Id must look like ") + prefix + "-1234.");
    return id;
}

// A course code is 2 to 4 capital letters followed by 3 digits, e.g. CS101.
inline std::string validCourseCode(const std::string& raw) {
    const std::string code = trim(raw);
    bool ok = code.size() >= 5 && code.size() <= 7;
    std::size_t letters = 0;
    while (ok && letters < code.size() && std::isupper(static_cast<unsigned char>(code[letters]))) ++letters;
    ok = ok && letters >= 2 && letters <= 4 && code.size() == letters + 3;
    for (std::size_t i = letters; ok && i < code.size(); ++i) ok = std::isdigit(static_cast<unsigned char>(code[i])) != 0;
    if (!ok) throw ValidationError("Course code must look like CS101.");
    return code;
}

// ---- grades -------------------------------------------------------------------------------------

// Marks out of 100 become grade points on a 4.0 scale.
inline double gradePoints(double marks) {
    if (marks >= 85) return 4.00;
    if (marks >= 80) return 3.67;
    if (marks >= 75) return 3.33;
    if (marks >= 70) return 3.00;
    if (marks >= 65) return 2.67;
    if (marks >= 60) return 2.33;
    if (marks >= 55) return 2.00;
    if (marks >= 50) return 1.00;
    return 0.00;
}

struct Result {
    std::string code;
    int credits;
    double marks;
};

// ---- people -------------------------------------------------------------------------------------

class Person {
public:
    Person(std::string id, std::string name) : id_(std::move(id)), name_(std::move(name)) {}
    virtual ~Person() = default;  // virtual, so deleting a Student through a Person pointer is safe

    const std::string& id() const { return id_; }
    const std::string& name() const { return name_; }

    virtual std::string role() const = 0;       // "Student" or "Faculty"
    virtual std::string summary() const = 0;    // one line for the list screen
    virtual std::string serialize() const = 0;  // one line for the data file

protected:
    std::string id_;
    std::string name_;
};

class Student : public Person {
public:
    Student(const std::string& id, const std::string& name) : Person(validId(id, 'S'), validName(name)) {}

    void addResult(const std::string& code, int credits, double marks) {
        const std::string clean = validCourseCode(code);
        if (credits < 1 || credits > 6) throw ValidationError("Credit hours must be between 1 and 6.");
        if (marks < 0 || marks > 100) throw ValidationError("Marks must be between 0 and 100.");
        const bool duplicate = std::any_of(results_.begin(), results_.end(), [&](const Result& r) { return r.code == clean; });
        if (duplicate) throw ValidationError(clean + " is already recorded for " + id_ + ".");
        results_.push_back({clean, credits, marks});
    }

    const std::vector<Result>& results() const { return results_; }

    // GPA = sum(grade points x credits) / sum(credits). A student with no results has a GPA of 0.
    double gpa() const {
        double points = 0;
        int credits = 0;
        for (const Result& r : results_) {
            points += gradePoints(r.marks) * r.credits;
            credits += r.credits;
        }
        return credits == 0 ? 0.0 : points / credits;
    }

    std::string role() const override { return "Student"; }

    std::string summary() const override {
        std::ostringstream out;
        out << std::left << std::setw(8) << id_ << std::setw(22) << name_ << "Student  " << results_.size() << " course(s)  GPA "
            << std::fixed << std::setprecision(2) << gpa();
        return out.str();
    }

    // S|S-1001|Ayesha Khan|CS101:3:88.5;MA101:3:72
    std::string serialize() const override {
        std::ostringstream out;
        out << "S|" << id_ << '|' << name_ << '|';
        for (std::size_t i = 0; i < results_.size(); ++i) {
            if (i) out << ';';
            out << results_[i].code << ':' << results_[i].credits << ':' << results_[i].marks;
        }
        return out.str();
    }

private:
    std::vector<Result> results_;
};

class Faculty : public Person {
public:
    Faculty(const std::string& id, const std::string& name, const std::string& department)
        : Person(validId(id, 'F'), validName(name)), department_(validName(department)) {}

    void teach(const std::string& code) {
        const std::string clean = validCourseCode(code);
        if (std::find(courses_.begin(), courses_.end(), clean) != courses_.end()) throw ValidationError(clean + " is already assigned.");
        courses_.push_back(clean);
    }

    const std::string& department() const { return department_; }
    const std::vector<std::string>& courses() const { return courses_; }

    std::string role() const override { return "Faculty"; }

    std::string summary() const override {
        std::ostringstream out;
        out << std::left << std::setw(8) << id_ << std::setw(22) << name_ << "Faculty  " << department_ << ", " << courses_.size() << " course(s)";
        return out.str();
    }

    // F|F-2001|Dr. Sana Malik|Computer Science|CS101;CS201
    std::string serialize() const override {
        std::ostringstream out;
        out << "F|" << id_ << '|' << name_ << '|' << department_ << '|';
        for (std::size_t i = 0; i < courses_.size(); ++i) out << (i ? ";" : "") << courses_[i];
        return out.str();
    }

private:
    std::string department_;
    std::vector<std::string> courses_;
};

}  // namespace edutrack
