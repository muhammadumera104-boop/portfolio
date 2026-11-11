// EduTrack: the registry owns every person and saves or loads them from a text file.
//
// File format: one record per line, fields separated by '|' (see Student::serialize and Faculty::serialize).
// Loading never crashes on a damaged file: a bad line is skipped and reported with its line number.
#pragma once

#include <fstream>
#include <memory>

#include "models.hpp"

namespace edutrack {

struct LoadReport {
    int loaded = 0;
    std::vector<std::string> problems;  // "line 3: Marks must be between 0 and 100."
};

class Registry {
public:
    // The registry takes ownership of the object (unique_ptr), so nothing needs to be deleted by hand.
    void add(std::unique_ptr<Person> person) {
        if (find(person->id()) != nullptr) throw ValidationError("Id " + person->id() + " already exists.");
        people_.push_back(std::move(person));
    }

    Person* find(const std::string& id) const {
        for (const auto& p : people_) if (p->id() == id) return p.get();
        return nullptr;
    }

    Student* findStudent(const std::string& id) const { return dynamic_cast<Student*>(find(id)); }
    Faculty* findFaculty(const std::string& id) const { return dynamic_cast<Faculty*>(find(id)); }

    const std::vector<std::unique_ptr<Person>>& people() const { return people_; }

    void save(const std::string& path) const {
        std::ofstream file(path, std::ios::trunc);
        if (!file.is_open()) throw std::runtime_error("Cannot write " + path);
        for (const auto& p : people_) file << p->serialize() << '\n';
    }

    // Replaces the current contents with the file's valid lines.
    LoadReport load(const std::string& path) {
        std::ifstream file(path);
        // is_open() is the reliable way to ask whether the file could be opened.
        if (!file.is_open()) throw std::runtime_error("Cannot open " + path);
        LoadReport report;
        people_.clear();
        std::string line;
        int number = 0;
        while (std::getline(file, line)) {
            ++number;
            if (trim(line).empty()) continue;
            try {
                add(parseLine(line));
                ++report.loaded;
            } catch (const std::exception& error) {
                report.problems.push_back("line " + std::to_string(number) + ": " + error.what());
            }
        }
        return report;
    }

private:
    static std::vector<std::string> split(const std::string& text, char sep) {
        std::vector<std::string> parts;
        std::string part;
        std::istringstream in(text);
        while (std::getline(in, part, sep)) parts.push_back(part);
        if (!text.empty() && text.back() == sep) parts.push_back("");
        return parts;
    }

    static std::unique_ptr<Person> parseLine(const std::string& line) {
        const auto f = split(line, '|');
        if (f.empty()) throw ValidationError("Empty record.");
        if (f[0] == "S" && f.size() == 4) {
            auto student = std::make_unique<Student>(f[1], f[2]);
            for (const std::string& item : split(f[3], ';')) {
                if (item.empty()) continue;
                const auto r = split(item, ':');
                if (r.size() != 3) throw ValidationError("Result must look like CS101:3:88.5.");
                try {
                    student->addResult(r[0], std::stoi(r[1]), std::stod(r[2]));
                } catch (const std::invalid_argument&) {
                    throw ValidationError("Credits and marks must be numbers.");
                }
            }
            return student;
        }
        if (f[0] == "F" && f.size() == 5) {
            auto faculty = std::make_unique<Faculty>(f[1], f[2], f[3]);
            for (const std::string& code : split(f[4], ';')) if (!code.empty()) faculty->teach(code);
            return faculty;
        }
        throw ValidationError("Unknown record type or wrong number of fields.");
    }

    std::vector<std::unique_ptr<Person>> people_;
};

}  // namespace edutrack
