package io.github.dmall.opendarts.user.model.mapper

import io.github.dmall.opendarts.user.entity.User
import io.github.dmall.opendarts.user.model.UserDto
import org.mapstruct.Mapper

@Mapper(componentModel = "spring")
interface UserMapper {
    fun dtoToEntity(dto: UserDto): User
}
