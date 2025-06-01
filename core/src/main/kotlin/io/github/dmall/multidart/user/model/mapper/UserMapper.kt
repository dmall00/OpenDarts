package io.github.dmall.multidart.user.model.mapper

import io.github.dmall.multidart.user.entity.User
import io.github.dmall.multidart.user.model.UserDto
import org.mapstruct.Mapper

@Mapper(componentModel = "spring")
interface UserMapper {

    fun dtoToEntity(dto: UserDto): User
}